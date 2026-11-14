package com.agrisense.config;

import com.agrisense.entity.Alert;
import com.agrisense.entity.AlertSeverity;
import com.agrisense.entity.Crop;
import com.agrisense.entity.CropHealth;
import com.agrisense.entity.Farm;
import com.agrisense.entity.FarmActivity;
import com.agrisense.entity.Field;
import com.agrisense.entity.FieldStatus;
import com.agrisense.entity.MarketPrice;
import com.agrisense.entity.Notification;
import com.agrisense.entity.Role;
import com.agrisense.entity.Sensor;
import com.agrisense.entity.SensorReading;
import com.agrisense.entity.User;
import com.agrisense.entity.WeatherData;
import com.agrisense.repository.AlertRepository;
import com.agrisense.repository.CropHealthRepository;
import com.agrisense.repository.CropRepository;
import com.agrisense.repository.FarmActivityRepository;
import com.agrisense.repository.FarmRepository;
import com.agrisense.repository.FieldRepository;
import com.agrisense.repository.MarketPriceRepository;
import com.agrisense.repository.NotificationRepository;
import com.agrisense.repository.SensorReadingRepository;
import com.agrisense.repository.SensorRepository;
import com.agrisense.repository.UserRepository;
import com.agrisense.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final CropHealthRepository cropHealthRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final WeatherDataRepository weatherDataRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final AlertRepository alertRepository;
    private final NotificationRepository notificationRepository;
    private final FarmActivityRepository farmActivityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("pugalini@agrisense.com")) {
            log.info("Demo data already present — skipping seed");
            return;
        }

        log.info("Seeding AgriSense demo data...");

        User user = userRepository.save(User.builder()
                .email("pugalini@agrisense.com")
                .password(passwordEncoder.encode("password123"))
                .fullName("Pugalini")
                .phone("+94 77 123 4567")
                .location("Jaffna, Sri Lanka")
                .role(Role.FARMER)
                .build());

        Farm farm1 = farmRepository.save(Farm.builder()
                .name("Northern Green Farm")
                .location("Jaffna, Sri Lanka")
                .areaAcres(120.0)
                .latitude(9.6615)
                .longitude(80.0255)
                .description("Primary paddy and maize operations")
                .user(user)
                .build());

        Farm farm2 = farmRepository.save(Farm.builder()
                .name("Coastal Valley Estate")
                .location("Point Pedro")
                .areaAcres(85.0)
                .latitude(9.8167)
                .longitude(80.2333)
                .description("Chili and tomato cultivation")
                .user(user)
                .build());

        Farm farm3 = farmRepository.save(Farm.builder()
                .name("Highland Organic Plot")
                .location("Kilinochchi")
                .areaAcres(107.5)
                .latitude(9.3803)
                .longitude(80.3770)
                .description("Mixed organic vegetables")
                .user(user)
                .build());

        List<Field> fields = new ArrayList<>();
        fields.add(createField("Field 1", 45.0, "Paddy", FieldStatus.HEALTHY, 9.68, 80.02, farm1));
        fields.add(createField("Field 2", 38.0, "Maize", FieldStatus.MODERATE, 9.66, 80.04, farm1));
        fields.add(createField("Field 3", 22.0, "Chili", FieldStatus.ATTENTION, 9.64, 80.01, farm2));
        fields.add(createField("Field 4", 18.0, "Tomato", FieldStatus.HEALTHY, 9.67, 80.06, farm2));
        fields.add(createField("Coastal Chili Block", 12.0, "Chili", FieldStatus.MODERATE, 9.8200, 80.2300, farm2));
        fields.add(createField("Organic Mixed Plot", 15.0, "Onion", FieldStatus.HEALTHY, 9.3820, 80.3790, farm3));
        fields.add(createField("Kilinochchi Maize", 20.0, "Maize", FieldStatus.HEALTHY, 9.3780, 80.3750, farm3));

        String[][] cropSpecs = {
                {"Paddy", "Bg 352", "Vegetative", "Healthy"},
                {"Maize", "Pacific 984", "Vegetative", "Moderate"},
                {"Chili", "KA-2", "Fruiting", "Attention"},
                {"Tomato", "Thilina", "Flowering", "Healthy"},
                {"Chili", "MI-2", "Vegetative", "Moderate"},
                {"Onion", "Red Creole", "Bulbing", "Healthy"},
                {"Maize", "Bhadra", "Tasseling", "Healthy"}
        };

        LocalDate today = LocalDate.now();
        List<Crop> crops = new ArrayList<>();
        for (int i = 0; i < fields.size(); i++) {
            Field field = fields.get(i);
            String[] spec = cropSpecs[i];
            Crop crop = cropRepository.save(Crop.builder()
                    .name(spec[0])
                    .variety(spec[1])
                    .plantingDate(today.minusDays(40 + i * 7L))
                    .expectedHarvestDate(today.plusDays(50 + i * 5L))
                    .growthStage(spec[2])
                    .healthStatus(spec[3])
                    .areaAcres(field.getAreaAcres())
                    .field(field)
                    .build());
            crops.add(crop);

            cropHealthRepository.save(CropHealth.builder()
                    .status(spec[3])
                    .notes("Initial health assessment for " + spec[0])
                    .recordedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                    .crop(crop)
                    .build());
        }

        ThreadLocalRandom random = ThreadLocalRandom.current();
        for (Field field : fields) {
            Sensor moisture = sensorRepository.save(Sensor.builder()
                    .name(field.getName() + " Moisture")
                    .sensorType("Soil Moisture")
                    .unit("%")
                    .field(field)
                    .build());
            Sensor temperature = sensorRepository.save(Sensor.builder()
                    .name(field.getName() + " Temperature")
                    .sensorType("Temperature")
                    .unit("°C")
                    .field(field)
                    .build());
            Sensor humidity = sensorRepository.save(Sensor.builder()
                    .name(field.getName() + " Humidity")
                    .sensorType("Humidity")
                    .unit("%")
                    .field(field)
                    .build());

            seedReadings(moisture, 30, 70, random);
            seedReadings(temperature, 25, 34, random);
            seedReadings(humidity, 55, 88, random);
        }

        String[] conditions = {"Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm", "Clear", "Humid"};
        for (int i = 0; i < 7; i++) {
            weatherDataRepository.save(WeatherData.builder()
                    .location("Jaffna, Sri Lanka")
                    .temperature(29.0 + (i % 4))
                    .humidity(62.0 + i * 2)
                    .windSpeed(9.0 + i * 0.8)
                    .rainfall(i % 3 == 0 ? 3.5 : 0.2)
                    .condition(conditions[i])
                    .forecastDate(today.plusDays(i))
                    .recordedAt(Instant.now())
                    .build());
            weatherDataRepository.save(WeatherData.builder()
                    .location("Point Pedro")
                    .temperature(28.0 + (i % 3))
                    .humidity(68.0 + i)
                    .windSpeed(10.0 + i * 0.5)
                    .rainfall(i % 2 == 0 ? 4.0 : 0.5)
                    .condition(conditions[(i + 2) % conditions.length])
                    .forecastDate(today.plusDays(i))
                    .recordedAt(Instant.now())
                    .build());
        }

        Object[][] markets = {
                {"Paddy", 120.0, 2.4, "Jaffna Wholesale"},
                {"Maize", 110.0, -1.1, "Jaffna Wholesale"},
                {"Tomato", 180.0, 5.6, "Nallur Market"},
                {"Chili", 950.0, 8.2, "Nallur Market"},
                {"Onion", 220.0, -0.8, "Jaffna Wholesale"}
        };
        for (Object[] row : markets) {
            marketPriceRepository.save(MarketPrice.builder()
                    .cropName((String) row[0])
                    .pricePerKg((Double) row[1])
                    .currency("LKR")
                    .changePercent((Double) row[2])
                    .market((String) row[3])
                    .recordedAt(Instant.now().minus(random.nextInt(1, 12), ChronoUnit.HOURS))
                    .build());
        }

        alertRepository.save(Alert.builder()
                .title("Disease Alert")
                .description("Early blight detected in Field 3 - Chili")
                .severity(AlertSeverity.CRITICAL)
                .type("DISEASE")
                .read(false)
                .timestamp(Instant.now().minus(2, ChronoUnit.HOURS))
                .user(user)
                .build());
        alertRepository.save(Alert.builder()
                .title("Weather Alert")
                .description("Heavy rain expected tomorrow")
                .severity(AlertSeverity.INFO)
                .type("WEATHER")
                .read(false)
                .timestamp(Instant.now().minus(5, ChronoUnit.HOURS))
                .user(user)
                .build());
        alertRepository.save(Alert.builder()
                .title("Irrigation Alert")
                .description("Soil moisture is low in Field 2 - Maize")
                .severity(AlertSeverity.WARNING)
                .type("IRRIGATION")
                .read(false)
                .timestamp(Instant.now().minus(8, ChronoUnit.HOURS))
                .user(user)
                .build());
        alertRepository.save(Alert.builder()
                .title("Irrigation Completed")
                .description("Field 1 - Paddy irrigation completed")
                .severity(AlertSeverity.SUCCESS)
                .type("IRRIGATION")
                .read(false)
                .timestamp(Instant.now().minus(12, ChronoUnit.HOURS))
                .user(user)
                .build());

        notificationRepository.save(Notification.builder()
                .title("Welcome to AgriSense")
                .message("Your demo farm data is ready. Explore the dashboard to get started.")
                .read(false)
                .timestamp(Instant.now())
                .user(user)
                .build());

        farmActivityRepository.save(FarmActivity.builder()
                .activityType("FERTILIZER")
                .description("Applied urea to Field 1 - Paddy")
                .performedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .farm(farm1)
                .build());
        farmActivityRepository.save(FarmActivity.builder()
                .activityType("IRRIGATION")
                .description("Completed irrigation cycle on Field 1 - Paddy")
                .performedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .farm(farm1)
                .build());
        farmActivityRepository.save(FarmActivity.builder()
                .activityType("SCOUTING")
                .description("Pest scouting completed on Field 3 - Chili")
                .performedAt(Instant.now().minus(12, ChronoUnit.HOURS))
                .farm(farm2)
                .build());

        log.info("Demo data seeded for user pugalini@agrisense.com (password: password123)");
    }

    private Field createField(String name, double acres, String cropType, FieldStatus status,
                              double lat, double lng, Farm farm) {
        return fieldRepository.save(Field.builder()
                .name(name)
                .areaAcres(acres)
                .cropType(cropType)
                .status(status)
                .latitude(lat)
                .longitude(lng)
                .farm(farm)
                .build());
    }

    private void seedReadings(Sensor sensor, double min, double max, ThreadLocalRandom random) {
        Instant now = Instant.now();
        for (int i = 20; i >= 0; i--) {
            sensorReadingRepository.save(SensorReading.builder()
                    .sensor(sensor)
                    .value(Math.round(random.nextDouble(min, max) * 100.0) / 100.0)
                    .recordedAt(now.minus(i * 10L, ChronoUnit.MINUTES))
                    .build());
        }
    }
}

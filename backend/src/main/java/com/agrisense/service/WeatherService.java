package com.agrisense.service;

import com.agrisense.dto.WeatherDto;
import com.agrisense.entity.WeatherData;
import com.agrisense.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final WeatherDataRepository weatherDataRepository;

    @Value("${agrisense.weather.default-location:Jaffna, Sri Lanka}")
    private String defaultLocation;

    @Transactional(readOnly = true)
    public WeatherDto getWeather(String location) {
        String loc = location != null && !location.isBlank() ? location : defaultLocation;
        LocalDate today = LocalDate.now();

        List<WeatherData> stored = weatherDataRepository.findByLocationOrderByForecastDateAsc(loc);
        if (stored.isEmpty()) {
            stored = weatherDataRepository.findTop7ByOrderByForecastDateAsc();
        }
        if (stored.isEmpty()) {
            return enrichResponse(generateDemoWeather(loc, today), today);
        }

        List<WeatherDto> forecast = stored.stream()
                .sorted(Comparator.comparing(WeatherData::getForecastDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(data -> toDto(data, today))
                .toList();

        WeatherDto current = forecast.stream()
                .filter(w -> today.equals(w.getForecastDate()))
                .findFirst()
                .orElse(forecast.get(0));

        WeatherDto response = WeatherDto.builder()
                .location(current.getLocation())
                .temperature(current.getTemperature())
                .humidity(current.getHumidity())
                .windSpeed(current.getWindSpeed())
                .rainfall(current.getRainfall())
                .condition(current.getCondition())
                .forecastDate(current.getForecastDate())
                .recordedAt(current.getRecordedAt())
                .dayLabel(current.getDayLabel())
                .rainProbability(current.getRainProbability())
                .forecast(forecast)
                .build();

        return enrichResponse(response, today);
    }

    private WeatherDto generateDemoWeather(String location, LocalDate today) {
        String[] conditions = {"Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm", "Clear", "Humid"};
        List<WeatherDto> forecast = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.plusDays(i);
            double rainfall = i % 3 == 0 ? 2.5 : 0.0;
            String condition = conditions[i % conditions.length];
            forecast.add(WeatherDto.builder()
                    .location(location)
                    .temperature(28.0 + (i % 3) - 1)
                    .humidity(65.0 + i)
                    .windSpeed(8.0 + i * 0.5)
                    .rainfall(rainfall)
                    .condition(condition)
                    .forecastDate(date)
                    .recordedAt(Instant.now())
                    .dayLabel(dayLabel(date, today))
                    .rainProbability(rainProbability(condition, rainfall))
                    .build());
        }
        WeatherDto current = forecast.get(0);
        current.setForecast(forecast);
        return current;
    }

    private WeatherDto toDto(WeatherData data, LocalDate today) {
        LocalDate date = data.getForecastDate();
        return WeatherDto.builder()
                .location(data.getLocation())
                .temperature(data.getTemperature())
                .humidity(data.getHumidity())
                .windSpeed(data.getWindSpeed())
                .rainfall(data.getRainfall())
                .condition(data.getCondition())
                .forecastDate(date)
                .recordedAt(data.getRecordedAt())
                .dayLabel(date != null ? dayLabel(date, today) : null)
                .rainProbability(rainProbability(data.getCondition(), data.getRainfall()))
                .build();
    }

    private WeatherDto enrichResponse(WeatherDto response, LocalDate today) {
        List<WeatherDto> forecast = response.getForecast();
        if (forecast != null) {
            for (int i = 0; i < forecast.size(); i++) {
                WeatherDto day = forecast.get(i);
                if (day.getDayLabel() == null && day.getForecastDate() != null) {
                    day.setDayLabel(dayLabel(day.getForecastDate(), today));
                }
                if (day.getRainProbability() == null) {
                    day.setRainProbability(rainProbability(day.getCondition(), day.getRainfall()));
                }
            }
        }

        response.setRecommendations(buildRecommendations(response));
        response.setAlerts(buildAlerts(response));
        if (response.getDayLabel() == null && response.getForecastDate() != null) {
            response.setDayLabel(dayLabel(response.getForecastDate(), today));
        }
        if (response.getRainProbability() == null) {
            response.setRainProbability(rainProbability(response.getCondition(), response.getRainfall()));
        }
        return response;
    }

    private String dayLabel(LocalDate date, LocalDate today) {
        if (date.equals(today)) {
            return "Today";
        }
        return date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
    }

    private double rainProbability(String condition, Double rainfall) {
        if (condition != null) {
            String c = condition.toLowerCase(Locale.ENGLISH);
            if (c.contains("thunder") || c.contains("heavy")) {
                return 85.0;
            }
            if (c.contains("rain")) {
                return 70.0;
            }
            if (c.contains("cloud")) {
                return 40.0;
            }
            if (c.contains("sunny") || c.contains("clear")) {
                return 10.0;
            }
        }
        if (rainfall != null && rainfall > 5) {
            return 80.0;
        }
        if (rainfall != null && rainfall > 0) {
            return 45.0;
        }
        return 20.0;
    }

    private List<String> buildRecommendations(WeatherDto weather) {
        List<String> recommendations = new ArrayList<>();
        String condition = weather.getCondition() != null ? weather.getCondition().toLowerCase(Locale.ENGLISH) : "";
        double rainfall = weather.getRainfall() != null ? weather.getRainfall() : 0;
        double humidity = weather.getHumidity() != null ? weather.getHumidity() : 65;
        boolean rainy = rainfall > 0 || condition.contains("rain") || condition.contains("thunder");

        if (!rainy && humidity < 75) {
            recommendations.add("Good day for irrigation");
        } else if (rainy) {
            recommendations.add("Avoid pesticide spraying due to rain");
        } else {
            recommendations.add("Monitor soil moisture before irrigating");
        }

        if (!rainy && weather.getTemperature() != null && weather.getTemperature() >= 26 && weather.getTemperature() <= 34) {
            recommendations.add("Suitable conditions for harvesting");
        } else if (rainy) {
            recommendations.add("Delay harvest until foliage dries");
        } else {
            recommendations.add("Check crop stress during peak heat");
        }

        if (humidity >= 80) {
            recommendations.add("High humidity — scout for fungal disease");
        } else {
            recommendations.add("Favorable window for field scouting");
        }

        return recommendations;
    }

    private List<String> buildAlerts(WeatherDto weather) {
        List<String> alerts = new ArrayList<>();
        String condition = weather.getCondition() != null ? weather.getCondition().toLowerCase(Locale.ENGLISH) : "";
        double rainfall = weather.getRainfall() != null ? weather.getRainfall() : 0;
        boolean rainy = rainfall > 0 || condition.contains("rain") || condition.contains("thunder");

        if (rainy) {
            alerts.add("Rain expected — secure equipment and delay spraying");
            if (rainfall >= 5 || condition.contains("thunder") || condition.contains("heavy")) {
                alerts.add("Heavy rain risk — check field drainage");
            }
        }

        if (weather.getForecast() != null) {
            boolean rainTomorrow = weather.getForecast().stream()
                    .skip(1)
                    .limit(1)
                    .anyMatch(d -> {
                        double r = d.getRainfall() != null ? d.getRainfall() : 0;
                        String c = d.getCondition() != null ? d.getCondition().toLowerCase(Locale.ENGLISH) : "";
                        return r > 0 || c.contains("rain") || c.contains("thunder");
                    });
            if (rainTomorrow && alerts.stream().noneMatch(a -> a.toLowerCase(Locale.ENGLISH).contains("rain"))) {
                alerts.add("Rain likely tomorrow — plan irrigation and spraying accordingly");
            }
        }

        return alerts;
    }
}

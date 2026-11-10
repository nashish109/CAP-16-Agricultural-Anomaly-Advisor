package com.agrisense.scheduler;

import com.agrisense.dto.SensorReadingDto;
import com.agrisense.entity.Sensor;
import com.agrisense.entity.SensorReading;
import com.agrisense.repository.SensorReadingRepository;
import com.agrisense.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class SensorSimulator {

    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void generateReadings() {
        List<Sensor> sensors = sensorRepository.findAll();
        if (sensors.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (Sensor sensor : sensors) {
            double value = generateRealisticValue(sensor.getSensorType(), random);
            SensorReading reading = SensorReading.builder()
                    .sensor(sensor)
                    .value(Math.round(value * 100.0) / 100.0)
                    .recordedAt(now)
                    .build();
            reading = sensorReadingRepository.save(reading);

            SensorReadingDto dto = SensorReadingDto.builder()
                    .id(reading.getId())
                    .sensorId(sensor.getId())
                    .sensorName(sensor.getName())
                    .sensorType(sensor.getSensorType())
                    .unit(sensor.getUnit())
                    .value(reading.getValue())
                    .recordedAt(reading.getRecordedAt())
                    .fieldId(sensor.getField().getId())
                    .build();

            messagingTemplate.convertAndSend("/topic/sensors/" + sensor.getField().getId(), dto);
        }

        log.debug("Generated {} sensor readings", sensors.size());
    }

    private double generateRealisticValue(String sensorType, ThreadLocalRandom random) {
        if (sensorType == null) {
            return random.nextDouble(10, 90);
        }
        String type = sensorType.toLowerCase();
        if (type.contains("moisture")) {
            return random.nextDouble(20, 75);
        }
        if (type.contains("temperature")) {
            return random.nextDouble(24, 36);
        }
        if (type.contains("humidity")) {
            return random.nextDouble(50, 90);
        }
        if (type.contains("ph")) {
            return random.nextDouble(5.5, 7.5);
        }
        if (type.contains("nitrogen") || type.contains("npk")) {
            return random.nextDouble(20, 80);
        }
        if (type.contains("light") || type.contains("lux")) {
            return random.nextDouble(200, 1200);
        }
        if (type.contains("rainfall")) {
            return random.nextDouble(0, 15);
        }
        return random.nextDouble(10, 90);
    }
}

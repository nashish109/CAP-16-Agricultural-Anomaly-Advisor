package com.agrisense.service;

import com.agrisense.dto.IrrigationRecommendationDto;
import com.agrisense.entity.Field;
import com.agrisense.entity.Irrigation;
import com.agrisense.entity.IrrigationStatus;
import com.agrisense.entity.Sensor;
import com.agrisense.entity.SensorReading;
import com.agrisense.exception.BadRequestException;
import com.agrisense.repository.IrrigationRepository;
import com.agrisense.repository.SensorReadingRepository;
import com.agrisense.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IrrigationService {

    private final IrrigationRepository irrigationRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final FieldService fieldService;

    @Transactional(readOnly = true)
    public IrrigationRecommendationDto getRecommendation(Long fieldId) {
        Field field = fieldService.getOwnedField(fieldId);
        Double soilMoisture = latestSensorValue(fieldId, "moisture");
        Double soilTemperature = latestSensorValue(fieldId, "temperature");
        Double humidity = latestSensorValue(fieldId, "humidity");

        int duration;
        double waterAmount;
        String urgency;
        String recommendation;

        if (soilMoisture == null) {
            soilMoisture = 35.0;
        }
        if (soilTemperature == null) {
            soilTemperature = 26.0;
        }
        if (humidity == null) {
            humidity = 65.0;
        }

        if (soilMoisture < 25) {
            duration = 45;
            waterAmount = 2500.0;
            urgency = "HIGH";
            recommendation = "Soil moisture is critically low. Start irrigation immediately for " + duration + " minutes.";
        } else if (soilMoisture < 40) {
            duration = 30;
            waterAmount = 1800.0;
            urgency = "MEDIUM";
            recommendation = "Soil moisture is below optimal. Irrigate for " + duration + " minutes within the next few hours.";
        } else if (soilMoisture < 55) {
            duration = 15;
            waterAmount = 900.0;
            urgency = "LOW";
            recommendation = "Soil moisture is moderate. A short irrigation cycle may help maintain optimal levels.";
        } else {
            duration = 0;
            waterAmount = 0.0;
            urgency = "NONE";
            recommendation = "Soil moisture is adequate. No irrigation needed at this time.";
        }

        return IrrigationRecommendationDto.builder()
                .fieldId(field.getId())
                .fieldName(field.getName())
                .recommendedDurationMinutes(duration)
                .recommendedMinutes(duration)
                .recommendedWaterAmount(waterAmount)
                .waterRequirement(Math.round(waterAmount) + " L")
                .recommendation(recommendation)
                .soilMoisture(soilMoisture)
                .soilTemperature(soilTemperature)
                .humidity(humidity)
                .rainfall(0.0)
                .ph(6.5)
                .urgency(urgency)
                .status(statusFromUrgency(urgency))
                .build();
    }

    @Transactional
    public Irrigation startIrrigation(Long fieldId, Integer durationMinutes, Double waterAmount) {
        Field field = fieldService.getOwnedField(fieldId);
        IrrigationRecommendationDto recommendation = getRecommendation(fieldId);

        if (durationMinutes == null) {
            durationMinutes = recommendation.getRecommendedDurationMinutes();
        }
        if (durationMinutes == null || durationMinutes <= 0) {
            throw new BadRequestException("Irrigation is not recommended right now");
        }
        if (waterAmount == null) {
            waterAmount = recommendation.getRecommendedWaterAmount();
        }

        Irrigation irrigation = Irrigation.builder()
                .field(field)
                .durationMinutes(durationMinutes)
                .waterAmount(waterAmount)
                .status(IrrigationStatus.RUNNING)
                .recommendation(recommendation.getRecommendation())
                .startedAt(Instant.now())
                .build();

        return irrigationRepository.save(irrigation);
    }

    private String statusFromUrgency(String urgency) {
        if (urgency == null) {
            return "Moderate";
        }
        return switch (urgency.toUpperCase(Locale.ENGLISH)) {
            case "HIGH" -> "Attention";
            case "MEDIUM" -> "Moderate";
            case "LOW" -> "Low";
            case "NONE" -> "Good";
            default -> urgency;
        };
    }

    private Double latestSensorValue(Long fieldId, String typeKeyword) {
        List<Sensor> sensors = sensorRepository.findByFieldId(fieldId);
        String keyword = typeKeyword.toLowerCase(Locale.ENGLISH);
        return sensors.stream()
                .filter(s -> s.getSensorType() != null && s.getSensorType().toLowerCase(Locale.ENGLISH).contains(keyword))
                .map(sensor -> sensorReadingRepository.findTop50BySensorIdOrderByRecordedAtDesc(sensor.getId()))
                .filter(list -> !list.isEmpty())
                .map(list -> list.get(0))
                .max(Comparator.comparing(SensorReading::getRecordedAt))
                .map(SensorReading::getValue)
                .orElse(null);
    }

    public Map<String, Object> toMap(Irrigation irrigation) {
        return Map.of(
                "id", irrigation.getId(),
                "fieldId", irrigation.getField().getId(),
                "durationMinutes", irrigation.getDurationMinutes(),
                "waterAmount", irrigation.getWaterAmount() != null ? irrigation.getWaterAmount() : 0,
                "status", irrigation.getStatus().name(),
                "recommendation", irrigation.getRecommendation() != null ? irrigation.getRecommendation() : "",
                "startedAt", irrigation.getStartedAt() != null ? irrigation.getStartedAt().toString() : ""
        );
    }
}

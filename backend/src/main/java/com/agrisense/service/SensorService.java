package com.agrisense.service;

import com.agrisense.dto.SensorReadingDto;
import com.agrisense.entity.Sensor;
import com.agrisense.entity.SensorReading;
import com.agrisense.repository.SensorReadingRepository;
import com.agrisense.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final FieldService fieldService;

    @Transactional(readOnly = true)
    public List<Sensor> getSensorsByField(Long fieldId) {
        fieldService.getOwnedField(fieldId);
        return sensorRepository.findByFieldId(fieldId);
    }

    @Transactional(readOnly = true)
    public List<SensorReadingDto> getReadingsByField(Long fieldId) {
        fieldService.getOwnedField(fieldId);
        return sensorReadingRepository.findBySensorFieldIdOrderByRecordedAtDesc(fieldId).stream()
                .map(this::toDto)
                .toList();
    }

    private SensorReadingDto toDto(SensorReading reading) {
        Sensor sensor = reading.getSensor();
        return SensorReadingDto.builder()
                .id(reading.getId())
                .sensorId(sensor.getId())
                .sensorName(sensor.getName())
                .sensorType(sensor.getSensorType())
                .unit(sensor.getUnit())
                .value(reading.getValue())
                .recordedAt(reading.getRecordedAt())
                .fieldId(sensor.getField().getId())
                .build();
    }
}

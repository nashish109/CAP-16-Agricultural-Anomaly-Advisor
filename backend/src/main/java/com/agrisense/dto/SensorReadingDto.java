package com.agrisense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorReadingDto {

    private Long id;
    private Long sensorId;
    private String sensorName;
    private String sensorType;
    private String unit;
    private Double value;
    private Instant recordedAt;
    private Long fieldId;
}

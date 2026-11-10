package com.agrisense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationRecommendationDto {

    private Long fieldId;
    private String fieldName;
    private Integer recommendedDurationMinutes;
    /** Mirrors recommendedDurationMinutes for frontend contract. */
    private Integer recommendedMinutes;
    private Double recommendedWaterAmount;
    private String waterRequirement;
    private String recommendation;
    private Double soilMoisture;
    private Double soilTemperature;
    private Double humidity;
    private Double rainfall;
    private Double ph;
    private String urgency;
    private String status;
}

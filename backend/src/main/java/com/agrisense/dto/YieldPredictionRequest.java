package com.agrisense.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldPredictionRequest {

    @NotBlank
    private String cropName;

    private Long fieldId;
    private Double areaAcres;
    private String season;
    private String soilType;
    private Double rainfall;
    private Double temperature;
}

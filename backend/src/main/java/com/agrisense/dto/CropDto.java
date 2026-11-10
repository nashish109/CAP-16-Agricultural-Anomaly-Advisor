package com.agrisense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropDto {

    private Long id;

    @NotBlank
    private String name;

    private String variety;
    private LocalDate plantingDate;
    private LocalDate expectedHarvestDate;
    private String growthStage;
    private String healthStatus;
    private Double areaAcres;

    @NotNull
    private Long fieldId;

    private String fieldName;
}

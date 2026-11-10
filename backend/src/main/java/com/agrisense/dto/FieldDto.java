package com.agrisense.dto;

import com.agrisense.entity.FieldStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldDto {

    private Long id;

    @NotBlank
    private String name;

    private Double areaAcres;
    private String cropType;
    private FieldStatus status;
    private Double latitude;
    private Double longitude;

    @NotNull
    private Long farmId;

    private String farmName;
}

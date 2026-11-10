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
public class FarmDto {

    private Long id;

    @NotBlank
    private String name;

    private String location;
    private Double areaAcres;
    private Double latitude;
    private Double longitude;
    private String description;
    private Long userId;
    private Integer fieldCount;
    private Integer cropCount;
}

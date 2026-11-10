package com.agrisense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiseaseDetectionResponse {

    private Long id;
    private String cropName;
    /** Alias for cropName — matches frontend contract. */
    private String crop;
    private String disease;
    private Double confidence;
    private String description;
    private List<String> treatment;
    private List<String> prevention;
    private List<String> recommendations;
    private String imagePath;
    private Instant detectedAt;
    private Long fieldId;
}

package com.agrisense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldPredictionResponse {

    private Long id;
    private String cropName;
    private Double predictedYield;
    private String unit;
    private Double confidence;
    private String season;
    private Double areaAcres;
    private List<String> factors;
    private Long fieldId;
    private Double changeVsLastSeason;
    private List<HistoricalYield> historical;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalYield {
        private String season;
        private Double yield;
    }
}

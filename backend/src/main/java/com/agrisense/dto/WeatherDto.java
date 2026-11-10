package com.agrisense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDto {

    private String location;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private Double rainfall;
    private String condition;
    private LocalDate forecastDate;
    private Instant recordedAt;
    private String dayLabel;
    private Double rainProbability;
    private List<String> recommendations;
    private List<String> alerts;
    private List<WeatherDto> forecast;
}

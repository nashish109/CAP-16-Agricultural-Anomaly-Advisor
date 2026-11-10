package com.agrisense.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "weather_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherData extends BaseEntity {

    @Column(nullable = false)
    private String location;

    private Double temperature;

    private Double humidity;

    private Double windSpeed;

    private Double rainfall;

    private String condition;

    private LocalDate forecastDate;

    @Column(nullable = false)
    private Instant recordedAt;
}

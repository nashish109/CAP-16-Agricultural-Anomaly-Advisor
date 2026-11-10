package com.agrisense.repository;

import com.agrisense.entity.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {
    List<WeatherData> findByLocationOrderByForecastDateAsc(String location);
    List<WeatherData> findByForecastDateGreaterThanEqualOrderByForecastDateAsc(LocalDate date);
    Optional<WeatherData> findFirstByForecastDateOrderByRecordedAtDesc(LocalDate date);
    List<WeatherData> findTop7ByOrderByForecastDateAsc();
}

package com.agrisense.repository;

import com.agrisense.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    List<SensorReading> findBySensorFieldIdOrderByRecordedAtDesc(Long fieldId);
    List<SensorReading> findTop50BySensorIdOrderByRecordedAtDesc(Long sensorId);
    List<SensorReading> findBySensorIdOrderByRecordedAtDesc(Long sensorId);
}

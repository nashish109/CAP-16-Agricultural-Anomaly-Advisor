package com.agrisense.repository;

import com.agrisense.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    List<Sensor> findByFieldId(Long fieldId);
}

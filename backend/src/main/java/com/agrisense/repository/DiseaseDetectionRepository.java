package com.agrisense.repository;

import com.agrisense.entity.DiseaseDetection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiseaseDetectionRepository extends JpaRepository<DiseaseDetection, Long> {
    List<DiseaseDetection> findByFieldIdOrderByDetectedAtDesc(Long fieldId);
}

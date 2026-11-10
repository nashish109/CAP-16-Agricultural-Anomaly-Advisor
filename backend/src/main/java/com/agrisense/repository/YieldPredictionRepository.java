package com.agrisense.repository;

import com.agrisense.entity.YieldPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface YieldPredictionRepository extends JpaRepository<YieldPrediction, Long> {
    List<YieldPrediction> findByFieldIdOrderByCreatedAtDesc(Long fieldId);
}

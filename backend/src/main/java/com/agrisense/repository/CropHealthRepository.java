package com.agrisense.repository;

import com.agrisense.entity.CropHealth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CropHealthRepository extends JpaRepository<CropHealth, Long> {
    List<CropHealth> findByCropIdOrderByRecordedAtDesc(Long cropId);
}

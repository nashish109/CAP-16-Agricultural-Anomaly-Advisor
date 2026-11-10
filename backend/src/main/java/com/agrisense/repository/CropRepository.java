package com.agrisense.repository;

import com.agrisense.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByFieldId(Long fieldId);
    List<Crop> findByFieldFarmId(Long farmId);
    List<Crop> findByFieldFarmUserId(Long userId);
}

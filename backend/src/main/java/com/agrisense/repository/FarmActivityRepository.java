package com.agrisense.repository;

import com.agrisense.entity.FarmActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FarmActivityRepository extends JpaRepository<FarmActivity, Long> {
    List<FarmActivity> findByFarmIdOrderByPerformedAtDesc(Long farmId);
}

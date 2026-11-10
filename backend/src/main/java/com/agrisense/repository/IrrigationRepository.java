package com.agrisense.repository;

import com.agrisense.entity.Irrigation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IrrigationRepository extends JpaRepository<Irrigation, Long> {
    List<Irrigation> findByFieldIdOrderByCreatedAtDesc(Long fieldId);
}

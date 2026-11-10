package com.agrisense.repository;

import com.agrisense.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {
    List<MarketPrice> findAllByOrderByRecordedAtDesc();
    List<MarketPrice> findByCropNameIgnoreCaseOrderByRecordedAtDesc(String cropName);
}

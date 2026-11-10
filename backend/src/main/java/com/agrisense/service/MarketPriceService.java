package com.agrisense.service;

import com.agrisense.dto.MarketPriceDto;
import com.agrisense.entity.MarketPrice;
import com.agrisense.repository.MarketPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketPriceService {

    private final MarketPriceRepository marketPriceRepository;

    @Transactional(readOnly = true)
    public List<MarketPriceDto> getAll() {
        return marketPriceRepository.findAllByOrderByRecordedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    private MarketPriceDto toDto(MarketPrice price) {
        return MarketPriceDto.builder()
                .id(price.getId())
                .cropName(price.getCropName())
                .pricePerKg(price.getPricePerKg())
                .currency(price.getCurrency())
                .changePercent(price.getChangePercent())
                .market(price.getMarket())
                .recordedAt(price.getRecordedAt())
                .build();
    }
}

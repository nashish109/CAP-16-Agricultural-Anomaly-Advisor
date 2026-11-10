package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.MarketPriceDto;
import com.agrisense.service.MarketPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-prices")
@RequiredArgsConstructor
public class MarketPriceController {

    private final MarketPriceService marketPriceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MarketPriceDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(marketPriceService.getAll()));
    }
}

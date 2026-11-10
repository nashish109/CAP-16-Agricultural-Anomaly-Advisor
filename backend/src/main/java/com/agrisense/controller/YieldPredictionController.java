package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.YieldPredictionRequest;
import com.agrisense.dto.YieldPredictionResponse;
import com.agrisense.service.YieldPredictionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/yield-prediction")
@RequiredArgsConstructor
public class YieldPredictionController {

    private final YieldPredictionService yieldPredictionService;

    @PostMapping
    public ResponseEntity<ApiResponse<YieldPredictionResponse>> predict(
            @Valid @RequestBody YieldPredictionRequest request) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok("Yield predicted", yieldPredictionService.predict(request)));
    }
}

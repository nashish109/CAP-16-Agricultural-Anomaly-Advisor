package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.IrrigationRecommendationDto;
import com.agrisense.entity.Irrigation;
import com.agrisense.service.IrrigationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/irrigation")
@RequiredArgsConstructor
public class IrrigationController {

    private final IrrigationService irrigationService;

    @GetMapping("/recommendation")
    public ResponseEntity<ApiResponse<IrrigationRecommendationDto>> recommendation(
            @RequestParam Long fieldId) {
        return ResponseEntity.ok(ApiResponse.ok(irrigationService.getRecommendation(fieldId)));
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> start(
            @RequestBody Map<String, Object> body) {
        Long fieldId = Long.valueOf(String.valueOf(body.get("fieldId")));
        Integer duration = body.get("durationMinutes") != null
                ? Integer.valueOf(String.valueOf(body.get("durationMinutes")))
                : null;
        Double waterAmount = body.get("waterAmount") != null
                ? Double.valueOf(String.valueOf(body.get("waterAmount")))
                : null;

        Irrigation irrigation = irrigationService.startIrrigation(fieldId, duration, waterAmount);
        return ResponseEntity.ok(ApiResponse.ok("Irrigation started", irrigationService.toMap(irrigation)));
    }
}

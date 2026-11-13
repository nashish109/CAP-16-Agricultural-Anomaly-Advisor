
package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.service.AnomalyAnalyticsService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyAnalyticsService anomalyAnalyticsService;

    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<JsonNode>> batches() {
        return ResponseEntity.ok(
                ApiResponse.ok(anomalyAnalyticsService.getBatches())
        );
    }

    @GetMapping("/assessments")
    public ResponseEntity<ApiResponse<JsonNode>> assessments(
            @RequestParam(required = false) String batchId
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        anomalyAnalyticsService.getAssessments(batchId)
                )
        );
    }
}

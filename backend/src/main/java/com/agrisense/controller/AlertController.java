package com.agrisense.controller;

import com.agrisense.dto.AlertDto;
import com.agrisense.dto.ApiResponse;
import com.agrisense.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAlerts() {
        return ResponseEntity.ok(ApiResponse.ok(alertService.getAlerts()));
    }
}

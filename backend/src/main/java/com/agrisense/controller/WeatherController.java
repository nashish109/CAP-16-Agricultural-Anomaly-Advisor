package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.WeatherDto;
import com.agrisense.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping
    public ResponseEntity<ApiResponse<WeatherDto>> getWeather(
            @RequestParam(required = false, defaultValue = "Jaffna, Sri Lanka") String location) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getWeather(location)));
    }
}

package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.SensorDto;
import com.agrisense.dto.SensorReadingDto;
import com.agrisense.entity.Sensor;
import com.agrisense.service.SensorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/sensors")
@RequiredArgsConstructor
public class SensorController {

    private final SensorService sensorService;

    @GetMapping("/{fieldId}/readings")
    public ResponseEntity<ApiResponse<List<SensorReadingDto>>> getReadings(@PathVariable Long fieldId) {
        return ResponseEntity.ok(ApiResponse.ok(sensorService.getReadingsByField(fieldId)));
    }

    @GetMapping("/field/{fieldId}")
    public ResponseEntity<ApiResponse<List<SensorDto>>> getSensors(@PathVariable Long fieldId) {
        List<SensorDto> sensors = sensorService.getSensorsByField(fieldId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(sensors));
    }

    @GetMapping(value = "/stream/{fieldId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable Long fieldId) {
        SseEmitter emitter = new SseEmitter(0L);
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                List<SensorReadingDto> readings = sensorService.getReadingsByField(fieldId);
                List<SensorReadingDto> latest = readings.stream().limit(10).toList();
                emitter.send(SseEmitter.event()
                        .name("sensor-update")
                        .data(Map.of("fieldId", fieldId, "readings", latest)));
            } catch (IOException ex) {
                emitter.completeWithError(ex);
                executor.shutdown();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
                executor.shutdown();
            }
        }, 0, 10, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(() -> {
            executor.shutdown();
            emitter.complete();
        });

        return emitter;
    }

    private SensorDto toDto(Sensor sensor) {
        return SensorDto.builder()
                .id(sensor.getId())
                .name(sensor.getName())
                .sensorType(sensor.getSensorType())
                .unit(sensor.getUnit())
                .fieldId(sensor.getField().getId())
                .build();
    }
}

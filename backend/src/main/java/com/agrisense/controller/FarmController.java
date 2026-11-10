package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.FarmDto;
import com.agrisense.dto.MessageResponse;
import com.agrisense.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FarmDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(farmService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FarmDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(farmService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FarmDto>> create(@Valid @RequestBody FarmDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Farm created", farmService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FarmDto>> update(@PathVariable Long id, @Valid @RequestBody FarmDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Farm updated", farmService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> delete(@PathVariable Long id) {
        farmService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse("Farm deleted")));
    }
}

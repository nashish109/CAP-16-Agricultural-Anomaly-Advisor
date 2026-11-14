
package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.FarmDto;
import com.agrisense.dto.MessageResponse;
import com.agrisense.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FarmDto>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.ok(farmService.getAllFarms())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<ApiResponse<FarmDto>> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.ok(farmService.getFarmById(id))
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FarmDto>> create(
            @Valid @RequestBody FarmDto dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        "Farm created",
                        farmService.createFarm(dto)
                ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FarmDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody FarmDto dto) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Farm updated",
                        farmService.updateFarm(id, dto)
                )
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<MessageResponse>> delete(
            @PathVariable Long id) {

        farmService.deleteFarm(id);

        return ResponseEntity.ok(
                ApiResponse.ok(new MessageResponse("Farm deleted"))
        );
    }
}

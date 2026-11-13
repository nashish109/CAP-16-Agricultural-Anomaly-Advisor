
package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.CropDto;
import com.agrisense.dto.MessageResponse;
import com.agrisense.service.CropService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
@RequiredArgsConstructor
public class CropController {

    private final CropService cropService;

    // Farmers, analysts and admins can view crops
    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CropDto>>> getAll(
            @RequestParam(required = false) Long fieldId) {

        return ResponseEntity.ok(
                ApiResponse.ok(cropService.findAll(fieldId)));
    }

    // View an individual crop
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<ApiResponse<CropDto>> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.ok(cropService.findById(id)));
    }

    // Farmers and admins can create crops
    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CropDto>> create(
            @Valid @RequestBody CropDto dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        "Crop created",
                        cropService.create(dto)));
    }

    // Farmers and admins can update crops
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CropDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody CropDto dto) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Crop updated",
                        cropService.update(id, dto)));
    }

    // Farmers and admins can delete crops
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<MessageResponse>> delete(
            @PathVariable Long id) {

        cropService.delete(id);

        return ResponseEntity.ok(
                ApiResponse.ok(new MessageResponse("Crop deleted")));
    }
}

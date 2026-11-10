package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.FieldDto;
import com.agrisense.dto.MessageResponse;
import com.agrisense.service.FieldService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fields")
@RequiredArgsConstructor
public class FieldController {

    private final FieldService fieldService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FieldDto>>> getAll(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(ApiResponse.ok(fieldService.findAll(farmId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FieldDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(fieldService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FieldDto>> create(@Valid @RequestBody FieldDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Field created", fieldService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FieldDto>> update(@PathVariable Long id, @Valid @RequestBody FieldDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Field updated", fieldService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> delete(@PathVariable Long id) {
        fieldService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse("Field deleted")));
    }
}

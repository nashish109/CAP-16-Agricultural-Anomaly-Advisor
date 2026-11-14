
package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.service.CurrentUserService;
import com.agrisense.service.DatasetQualityService;
import com.agrisense.service.DatasetUploadService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
public class DatasetController {

    private final DatasetUploadService datasetUploadService;
    private final DatasetQualityService datasetQualityService;
    private final CurrentUserService currentUserService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<JsonNode>> uploadDataset(
            @RequestParam("file") MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a non-empty CSV file."
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only CSV files are supported."
            );
        }

        Long ownerUserId = currentUserService.getCurrentUserId();

        try {
            JsonNode result = datasetUploadService.uploadCsv(
                    file.getBytes(),
                    filename,
                    ownerUserId
            );

            return ResponseEntity.ok(
                    ApiResponse.ok(
                            "Dataset uploaded successfully.",
                            result
                    )
            );

        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to read the uploaded CSV file.",
                    exception
            );
        }
    }

    @GetMapping("/quality")
    @PreAuthorize(
            "hasAnyRole('FARMER', 'ANALYST', 'ADMIN')"
    )
    public ResponseEntity<ApiResponse<JsonNode>> getQualityReport(
            @RequestParam(required = false) String batchId
    ) {

        JsonNode result = datasetQualityService.getQualityReport(batchId);

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Agricultural data quality report retrieved successfully.",
                        result
                )
        );
    }
}

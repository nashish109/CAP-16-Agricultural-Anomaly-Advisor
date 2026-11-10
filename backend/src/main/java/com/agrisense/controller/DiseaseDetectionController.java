package com.agrisense.controller;

import com.agrisense.dto.ApiResponse;
import com.agrisense.dto.DiseaseDetectionResponse;
import com.agrisense.service.DiseaseDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/disease-detection")
@RequiredArgsConstructor
public class DiseaseDetectionController {

    private final DiseaseDetectionService diseaseDetectionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DiseaseDetectionResponse>> detect(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "cropName", required = false) String cropName,
            @RequestParam(value = "fieldId", required = false) Long fieldId) throws Exception {
        DiseaseDetectionResponse response = diseaseDetectionService.detect(image, cropName, fieldId);
        return ResponseEntity.ok(ApiResponse.ok("Disease detection completed", response));
    }
}

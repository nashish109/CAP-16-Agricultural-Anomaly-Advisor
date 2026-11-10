package com.agrisense.service;

import com.agrisense.dto.DiseaseDetectionResponse;
import com.agrisense.entity.DiseaseDetection;
import com.agrisense.entity.Field;
import com.agrisense.repository.DiseaseDetectionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiseaseDetectionService {

    private final DiseaseDetectionRepository diseaseDetectionRepository;
    private final FieldService fieldService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${agrisense.ai-service-url:http://localhost:8000}")
    private String aiServiceUrl;

    @Transactional
    public DiseaseDetectionResponse detect(MultipartFile image, String cropName, Long fieldId) throws IOException {
        Field field = fieldId != null ? fieldService.getOwnedField(fieldId) : null;

        Path uploadDir = Paths.get("uploads", "disease");
        Files.createDirectories(uploadDir);
        String filename = UUID.randomUUID() + "_" + (image.getOriginalFilename() != null ? image.getOriginalFilename() : "image.jpg");
        Path imagePath = uploadDir.resolve(filename);
        Files.write(imagePath, image.getBytes());

        String resolvedCrop = cropName;
        String disease = "Unknown";
        double confidence = 0.5;
        String description = null;
        List<String> treatment = null;
        List<String> prevention = null;
        List<String> recommendations = List.of(
                "Monitor crop daily for spreading symptoms",
                "Ensure adequate airflow between plants",
                "Consult local agricultural extension officer"
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            });
            if (cropName != null) {
                body.add("crop_name", cropName);
            }

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/predict",
                    requestEntity,
                    Map.class
            );

            if (response.getBody() != null) {
                Map<?, ?> result = response.getBody();
                if (result.get("disease") != null) {
                    disease = String.valueOf(result.get("disease"));
                } else if (result.get("class") != null) {
                    disease = String.valueOf(result.get("class"));
                } else if (result.get("prediction") != null) {
                    disease = String.valueOf(result.get("prediction"));
                }
                if (result.get("confidence") != null) {
                    confidence = Double.parseDouble(String.valueOf(result.get("confidence")));
                }
                if (result.get("crop") != null && (resolvedCrop == null || resolvedCrop.isBlank())) {
                    resolvedCrop = String.valueOf(result.get("crop"));
                }
                if (result.get("cropName") != null && (resolvedCrop == null || resolvedCrop.isBlank())) {
                    resolvedCrop = String.valueOf(result.get("cropName"));
                }
                if (result.get("description") != null) {
                    description = String.valueOf(result.get("description"));
                }
                if (result.get("treatment") instanceof List<?> list) {
                    treatment = list.stream().map(String::valueOf).toList();
                }
                if (result.get("prevention") instanceof List<?> list) {
                    prevention = list.stream().map(String::valueOf).toList();
                }
                if (result.get("recommendations") instanceof List<?> list) {
                    recommendations = list.stream().map(String::valueOf).toList();
                }
            }
        } catch (RestClientException ex) {
            log.warn("AI service unavailable at {}/predict, using fallback detection: {}", aiServiceUrl, ex.getMessage());
            disease = fallbackDisease(cropName);
            confidence = 0.72;
            recommendations = List.of(
                    "Isolate affected plants if symptoms worsen",
                    "Apply recommended fungicide for " + disease,
                    "Improve drainage and avoid overhead watering"
            );
        }

        if (resolvedCrop == null || resolvedCrop.isBlank()) {
            resolvedCrop = "Unknown";
        }

        DiseaseExtras extras = resolveExtras(resolvedCrop, disease, description, treatment, prevention, recommendations);

        DiseaseDetection detection = DiseaseDetection.builder()
                .cropName(resolvedCrop)
                .disease(disease)
                .confidence(confidence)
                .recommendations(objectMapper.writeValueAsString(recommendations))
                .imagePath(imagePath.toString())
                .detectedAt(Instant.now())
                .field(field)
                .build();

        detection = diseaseDetectionRepository.save(detection);
        return toResponse(detection, recommendations, extras);
    }

    private String fallbackDisease(String cropName) {
        if (cropName == null) {
            return "Leaf Blight";
        }
        return switch (cropName.toLowerCase(Locale.ENGLISH)) {
            case "rice", "paddy" -> "Bacterial Leaf Blight";
            case "tomato" -> "Early Blight";
            case "potato" -> "Late Blight";
            case "chili", "chilli" -> "Anthracnose";
            case "tea" -> "Blister Blight";
            default -> "Leaf Spot";
        };
    }

    private DiseaseExtras resolveExtras(
            String crop,
            String disease,
            String description,
            List<String> treatment,
            List<String> prevention,
            List<String> recommendations
    ) {
        boolean blightLike = disease != null && disease.toLowerCase(Locale.ENGLISH).contains("blight");

        if (description == null || description.isBlank()) {
            if (blightLike) {
                description = "Early blight presents as dark concentric lesions on older leaves, often surrounded by a yellow halo. "
                        + "Progressive defoliation can reduce yield if untreated.";
            } else {
                description = disease + " detected on " + crop + ". Early intervention is recommended.";
            }
        }

        if (treatment == null || treatment.isEmpty()) {
            if (blightLike) {
                treatment = List.of(
                        "Remove and destroy severely infected leaves",
                        "Apply a recommended fungicide at labeled intervals",
                        "Avoid overhead irrigation to reduce leaf wetness"
                );
            } else if (recommendations != null && !recommendations.isEmpty()) {
                treatment = recommendations.stream().limit(2).toList();
            } else {
                treatment = List.of("Consult an agronomist for targeted treatment");
            }
        }

        if (prevention == null || prevention.isEmpty()) {
            if (blightLike) {
                prevention = List.of(
                        "Rotate crops and avoid planting solanaceous crops in the same bed",
                        "Improve airflow with proper plant spacing",
                        "Use disease-free seed and resistant varieties when available"
                );
            } else if (recommendations != null && recommendations.size() > 2) {
                prevention = recommendations.stream().skip(2).toList();
            } else {
                prevention = List.of(
                        "Scout fields regularly",
                        "Maintain field sanitation and remove plant debris"
                );
            }
        }

        return new DiseaseExtras(description, treatment, prevention);
    }

    private DiseaseDetectionResponse toResponse(
            DiseaseDetection detection,
            List<String> recommendations,
            DiseaseExtras extras
    ) {
        List<String> recs = recommendations;
        if (recs == null) {
            try {
                recs = objectMapper.readValue(detection.getRecommendations(), new TypeReference<>() {});
            } catch (Exception e) {
                recs = List.of(detection.getRecommendations());
            }
        }

        DiseaseExtras resolved = extras != null
                ? extras
                : resolveExtras(detection.getCropName(), detection.getDisease(), null, null, null, recs);

        return DiseaseDetectionResponse.builder()
                .id(detection.getId())
                .cropName(detection.getCropName())
                .crop(detection.getCropName())
                .disease(detection.getDisease())
                .confidence(detection.getConfidence())
                .description(resolved.description())
                .treatment(resolved.treatment())
                .prevention(resolved.prevention())
                .recommendations(recs)
                .imagePath(detection.getImagePath())
                .detectedAt(detection.getDetectedAt())
                .fieldId(detection.getField() != null ? detection.getField().getId() : null)
                .build();
    }

    private record DiseaseExtras(String description, List<String> treatment, List<String> prevention) {}
}

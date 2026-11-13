
package com.agrisense.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class DatasetUploadService {

    private final RestClient.Builder restClientBuilder;

    @Value("${agrisense.ai-service-url}")
    private String aiServiceUrl;

    @Value("${agrisense.internal-service-token:}")
    private String internalServiceToken;

    public JsonNode uploadCsv(
            byte[] fileBytes,
            String originalFilename,
            Long ownerUserId
    ) {

        if (fileBytes == null || fileBytes.length == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a non-empty CSV file."
            );
        }

        if (ownerUserId == null || ownerUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid authenticated user."
            );
        }

        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service authentication is not configured."
            );
        }

        String filename = originalFilename == null || originalFilename.isBlank()
                ? "agricultural-data.csv"
                : originalFilename;

        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> multipartBody =
                new LinkedMultiValueMap<>();

        multipartBody.add("file", fileResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Internal-Service-Token", internalServiceToken);
        headers.set("X-Owner-User-Id", ownerUserId.toString());

        try {
            return restClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/api/agricultural/upload-csv")
                    .headers(requestHeaders -> requestHeaders.addAll(headers))
                    .body(multipartBody)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Agricultural processing failed: " +
                            exception.getResponseBodyAsString(),
                    exception
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to communicate with the agricultural processing service.",
                    exception
            );
        }
    }
}

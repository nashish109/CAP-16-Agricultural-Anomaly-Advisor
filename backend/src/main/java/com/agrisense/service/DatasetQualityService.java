
package com.agrisense.service;

import com.agrisense.entity.Role;
import com.agrisense.entity.User;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class DatasetQualityService {

    private final RestClient.Builder restClientBuilder;
    private final CurrentUserService currentUserService;

    @Value("${agrisense.ai-service-url}")
    private String aiServiceUrl;

    @Value("${agrisense.internal-service-token:}")
    private String internalServiceToken;

    public JsonNode getQualityReport(String batchId) {

        User currentUser = currentUserService.getCurrentUser();
        Role role = currentUser.getRole();

        if (role != Role.FARMER
                && role != Role.ANALYST
                && role != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role is not authorized to access data quality reports."
            );
        }

        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service authentication is not configured."
            );
        }

        HttpHeaders headers = new HttpHeaders();

        headers.set("X-Internal-Service-Token", internalServiceToken);
        headers.set("X-User-Role", role.name());

        if (role == Role.FARMER) {
            headers.set(
                    "X-Owner-User-Id",
                    currentUser.getId().toString()
            );
        }

        URI requestUri = UriComponentsBuilder
                .fromUriString(aiServiceUrl)
                .path("/api/agricultural/quality")
                .queryParamIfPresent(
                        "batch_id",
                        java.util.Optional.ofNullable(
                                batchId == null || batchId.isBlank()
                                        ? null
                                        : batchId
                        )
                )
                .build()
                .encode()
                .toUri();

        try {
            JsonNode response = restClientBuilder.build()
                    .get()
                    .uri(requestUri)
                    .headers(requestHeaders ->
                            requestHeaders.addAll(headers)
                    )
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The quality service returned an empty response."
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Data quality request failed: "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to communicate with the agricultural quality service.",
                    exception
            );
        }
    }
}

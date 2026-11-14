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

@Service
@RequiredArgsConstructor
public class AnomalyAnalyticsService {

    private final RestClient.Builder restClientBuilder;
    private final CurrentUserService currentUserService;

    @Value("${agrisense.ai-service-url}")
    private String aiServiceUrl;

    @Value("${agrisense.internal-service-token:}")
    private String internalServiceToken;

    public JsonNode getBatches() {
        User currentUser = currentUserService.getCurrentUser();
        HttpHeaders headers = buildHeaders(currentUser);

        return executeGet(
                aiServiceUrl + "/api/anomalies/batches",
                headers
        );
    }

    public JsonNode getAssessments(String batchId) {
        User currentUser = currentUserService.getCurrentUser();
        HttpHeaders headers = buildHeaders(currentUser);

        return executeGetWithOptionalBatch(
                "/api/anomalies/assessments",
                batchId,
                headers,
                "Anomaly assessment"
        );
    }

    public JsonNode getRecommendations(String batchId) {
        User currentUser = currentUserService.getCurrentUser();
        HttpHeaders headers = buildHeaders(currentUser);

        return executeGetWithOptionalBatch(
                "/api/anomalies/recommendations",
                batchId,
                headers,
                "Agricultural recommendation"
        );
    }

    public JsonNode getComparablePlots(String batchId) {
        if (batchId == null || batchId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A dataset batch ID is required."
            );
        }

        User currentUser = currentUserService.getCurrentUser();
        HttpHeaders headers = buildHeaders(currentUser);

        return executeGetWithOptionalBatch(
                "/api/anomalies/comparable-plots",
                batchId,
                headers,
                "Comparable plot analysis"
        );
    }

    private JsonNode executeGetWithOptionalBatch(
            String endpoint,
            String batchId,
            HttpHeaders headers,
            String operation
    ) {
        String uri = aiServiceUrl + endpoint;

        if (batchId != null && !batchId.isBlank()) {
            uri += "?batch_id={batchId}";
        }

        try {
            RestClient.RequestHeadersUriSpec<?> request =
                    restClientBuilder.build().get();

            JsonNode response = request
                    .uri(
                            uri,
                            batchId != null && !batchId.isBlank()
                                    ? new Object[]{batchId}
                                    : new Object[]{}
                    )
                    .headers(requestHeaders ->
                            requestHeaders.addAll(headers)
                    )
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The " + operation.toLowerCase()
                                + " service returned an empty response."
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    operation + " request failed: "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to retrieve "
                            + operation.toLowerCase() + "s.",
                    exception
            );
        }
    }

    private HttpHeaders buildHeaders(User currentUser) {
        Role role = currentUser.getRole();

        if (role != Role.FARMER
                && role != Role.ANALYST
                && role != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role is not authorized to access anomaly assessments."
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

        return headers;
    }

    private JsonNode executeGet(String uri, HttpHeaders headers) {
        try {
            JsonNode response = restClientBuilder.build()
                    .get()
                    .uri(uri)
                    .headers(requestHeaders ->
                            requestHeaders.addAll(headers)
                    )
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The anomaly service returned an empty response."
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Anomaly service request failed: "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to communicate with the anomaly service.",
                    exception
            );
        }
    }
}


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

        String uri = aiServiceUrl + "/api/anomalies/assessments";

        if (batchId != null && !batchId.isBlank()) {
            uri += "?batch_id={batchId}";
        }

        try {
            RestClient.RequestHeadersUriSpec<?> request =
                    restClientBuilder.build().get();

            return request
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

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Anomaly assessment request failed: "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (Exception exception) {
            if (exception instanceof ResponseStatusException statusException) {
                throw statusException;
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to retrieve anomaly assessments.",
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

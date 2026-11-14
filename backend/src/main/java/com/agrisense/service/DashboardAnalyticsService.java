
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
public class DashboardAnalyticsService {

    private final RestClient.Builder restClientBuilder;
    private final CurrentUserService currentUserService;

    @Value("${agrisense.ai-service-url}")
    private String aiServiceUrl;

    @Value("${agrisense.internal-service-token:}")
    private String internalServiceToken;

    public JsonNode getAnalytics() {

        // Resolve identity and role from the authenticated database user.
        User currentUser = currentUserService.getCurrentUser();
        Role role = currentUser.getRole();

        if (role != Role.FARMER
                && role != Role.ANALYST
                && role != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role is not authorized to access dashboard analytics."
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

        // Farmers receive only their own analytics.
        // Analysts and admins receive cross-farm analytics.
        if (role == Role.FARMER) {
            headers.set(
                    "X-Owner-User-Id",
                    currentUser.getId().toString()
            );
        }

        try {
            JsonNode response = restClientBuilder.build()
                    .get()
                    .uri(aiServiceUrl + "/api/dashboard/analytics")
                    .headers(requestHeaders -> requestHeaders.addAll(headers))
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The analytics service returned an empty response."
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Dashboard analytics request failed: "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to communicate with the analytics service.",
                    exception
            );
        }
    }
}

package com.agrisense.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public final class ApiTestSupport {

    private ApiTestSupport() {}

    public static String registerAndLogin(MockMvc mvc, ObjectMapper mapper, String email, String password)
            throws Exception {
        String registerBody = """
                {
                  "email": "%s",
                  "password": "%s",
                  "fullName": "Test Farmer",
                  "phone": "+94 77 000 0000",
                  "location": "Jaffna"
                }
                """.formatted(email, password);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        String loginBody = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);

        MvcResult result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn();

        JsonNode root = mapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }

    public static String bearer(String token) {
        return "Bearer " + token;
    }
}

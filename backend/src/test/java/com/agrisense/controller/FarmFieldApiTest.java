package com.agrisense.controller;

import com.agrisense.support.ApiTestSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static com.agrisense.support.ApiTestSupport.bearer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FarmFieldApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void farmAndFieldCrud() throws Exception {
        String token = ApiTestSupport.registerAndLogin(mvc, objectMapper, "crud@agrisense.com", "password123");

        MvcResult createdFarm = mvc.perform(post("/api/farms")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Northern Farm",
                                  "location": "Jaffna",
                                  "areaAcres": 12.5,
                                  "description": "Paddy and vegetables"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Northern Farm"))
                .andExpect(jsonPath("$.data.fieldCount").value(0))
                .andReturn();

        long farmId = objectMapper.readTree(createdFarm.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mvc.perform(get("/api/farms").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mvc.perform(put("/api/farms/" + farmId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Northern Farm Updated",
                                  "location": "Jaffna",
                                  "areaAcres": 15
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Northern Farm Updated"));

        MvcResult createdField = mvc.perform(post("/api/fields")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Field A",
                                  "areaAcres": 4.0,
                                  "cropType": "Paddy",
                                  "status": "HEALTHY",
                                  "farmId": %d
                                }
                                """.formatted(farmId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Field A"))
                .andExpect(jsonPath("$.data.farmId").value((int) farmId))
                .andReturn();

        long fieldId = objectMapper.readTree(createdField.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mvc.perform(get("/api/fields?farmId=" + farmId).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mvc.perform(get("/api/farms/" + farmId).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fieldCount").value(1));

        mvc.perform(delete("/api/fields/" + fieldId).header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/farms/" + farmId).header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/farms/" + farmId).header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotAccessAnotherUsersFarm() throws Exception {
        String ownerToken = ApiTestSupport.registerAndLogin(mvc, objectMapper, "owner@agrisense.com", "password123");
        String otherToken = ApiTestSupport.registerAndLogin(mvc, objectMapper, "other@agrisense.com", "password123");

        MvcResult created = mvc.perform(post("/api/farms")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Private Farm","location":"Kilinochchi","areaAcres":8}
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long farmId = objectMapper.readTree(created.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mvc.perform(get("/api/farms/" + farmId).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/farms").header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void alertsAndMarketPricesAreReachable() throws Exception {
        String token = ApiTestSupport.registerAndLogin(mvc, objectMapper, "lists@agrisense.com", "password123");

        mvc.perform(get("/api/alerts").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        mvc.perform(get("/api/market-prices").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}

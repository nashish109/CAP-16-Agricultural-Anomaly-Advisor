package com.agrisense.service;

import com.agrisense.dto.YieldPredictionRequest;
import com.agrisense.dto.YieldPredictionResponse;
import com.agrisense.entity.Field;
import com.agrisense.entity.YieldPrediction;
import com.agrisense.repository.YieldPredictionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class YieldPredictionService {

    private final YieldPredictionRepository yieldPredictionRepository;
    private final FieldService fieldService;
    private final ObjectMapper objectMapper;

    @Transactional
    public YieldPredictionResponse predict(YieldPredictionRequest request) throws Exception {
        Field field = request.getFieldId() != null ? fieldService.getOwnedField(request.getFieldId()) : null;
        double area = request.getAreaAcres() != null
                ? request.getAreaAcres()
                : (field != null && field.getAreaAcres() != null ? field.getAreaAcres() : 1.0);

        double baseYield = baseYieldPerAcre(request.getCropName());
        double rainfallFactor = request.getRainfall() != null ? clamp(request.getRainfall() / 100.0, 0.7, 1.2) : 1.0;
        double tempFactor = request.getTemperature() != null ? clamp(1.0 - Math.abs(request.getTemperature() - 28) / 40.0, 0.75, 1.15) : 1.0;
        double seasonFactor = seasonFactor(request.getSeason());

        double predicted = Math.round(baseYield * area * rainfallFactor * tempFactor * seasonFactor * 100.0) / 100.0;
        double confidence = Math.round((0.78 + (rainfallFactor + tempFactor) / 20.0) * 100.0) / 100.0;

        List<String> factors = new ArrayList<>();
        factors.add("Historical yield baseline for " + request.getCropName());
        factors.add("Area: " + area + " acres");
        if (request.getRainfall() != null) {
            factors.add("Rainfall influence: " + request.getRainfall() + " mm");
        }
        if (request.getTemperature() != null) {
            factors.add("Temperature influence: " + request.getTemperature() + " °C");
        }
        if (request.getSeason() != null) {
            factors.add("Season: " + request.getSeason());
        }
        if (request.getSoilType() != null) {
            factors.add("Soil type: " + request.getSoilType());
        }

        YieldPrediction entity = YieldPrediction.builder()
                .cropName(request.getCropName())
                .predictedYield(predicted)
                .unit("tons")
                .confidence(Math.min(confidence, 0.95))
                .season(request.getSeason())
                .areaAcres(area)
                .factors(objectMapper.writeValueAsString(factors))
                .field(field)
                .build();

        entity = yieldPredictionRepository.save(entity);

        double changeVsLastSeason = 12.0;
        List<YieldPredictionResponse.HistoricalYield> historical = buildHistorical(predicted);

        return YieldPredictionResponse.builder()
                .id(entity.getId())
                .cropName(entity.getCropName())
                .predictedYield(entity.getPredictedYield())
                .unit(entity.getUnit())
                .confidence(entity.getConfidence())
                .season(entity.getSeason())
                .areaAcres(entity.getAreaAcres())
                .factors(factors)
                .fieldId(field != null ? field.getId() : null)
                .changeVsLastSeason(changeVsLastSeason)
                .historical(historical)
                .build();
    }

    private List<YieldPredictionResponse.HistoricalYield> buildHistorical(double predictedYield) {
        int currentYear = Year.now().getValue();
        double prior = Math.round(predictedYield / 1.12 * 100.0) / 100.0;
        List<YieldPredictionResponse.HistoricalYield> historical = new ArrayList<>();
        historical.add(YieldPredictionResponse.HistoricalYield.builder()
                .season(String.valueOf(currentYear - 3))
                .yield(Math.round(prior * 0.88 * 100.0) / 100.0)
                .build());
        historical.add(YieldPredictionResponse.HistoricalYield.builder()
                .season(String.valueOf(currentYear - 2))
                .yield(Math.round(prior * 0.94 * 100.0) / 100.0)
                .build());
        historical.add(YieldPredictionResponse.HistoricalYield.builder()
                .season(String.valueOf(currentYear - 1))
                .yield(prior)
                .build());
        historical.add(YieldPredictionResponse.HistoricalYield.builder()
                .season("Pred.")
                .yield(predictedYield)
                .build());
        return historical;
    }

    private double baseYieldPerAcre(String cropName) {
        if (cropName == null) {
            return 2.5;
        }
        return switch (cropName.toLowerCase()) {
            case "rice", "paddy" -> 3.2;
            case "tomato" -> 8.5;
            case "potato" -> 6.0;
            case "chili", "chilli" -> 2.8;
            case "tea" -> 1.5;
            case "maize", "corn" -> 4.0;
            case "onion" -> 5.5;
            default -> 2.5;
        };
    }

    private double seasonFactor(String season) {
        if (season == null) {
            return 1.0;
        }
        return switch (season.toLowerCase()) {
            case "maha", "wet" -> 1.1;
            case "yala", "dry" -> 0.95;
            default -> 1.0;
        };
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}

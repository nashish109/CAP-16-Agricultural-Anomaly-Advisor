package com.agrisense.service;

import com.agrisense.entity.FieldStatus;
import com.agrisense.entity.Sensor;
import com.agrisense.entity.SensorReading;
import com.agrisense.repository.AlertRepository;
import com.agrisense.repository.CropRepository;
import com.agrisense.repository.FarmRepository;
import com.agrisense.repository.FieldRepository;
import com.agrisense.repository.SensorReadingRepository;
import com.agrisense.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final AlertRepository alertRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Long userId = currentUserService.getCurrentUserId();

        var farms = farmRepository.findByUserId(userId);
        var fields = fieldRepository.findByFarmUserId(userId);
        var crops = cropRepository.findByFieldFarmUserId(userId);

        long healthyFields = fields.stream().filter(f -> f.getStatus() == FieldStatus.HEALTHY).count();
        long attentionFields = fields.stream().filter(f -> f.getStatus() == FieldStatus.ATTENTION).count();
        long moderateFields = fields.stream().filter(f -> f.getStatus() == FieldStatus.MODERATE).count();

        double totalArea = farms.stream()
                .mapToDouble(f -> f.getAreaAcres() != null ? f.getAreaAcres() : 0)
                .sum();
        double roundedArea = Math.round(totalArea * 100.0) / 100.0;

        long unreadAlerts = alertRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .filter(a -> !a.isRead())
                .count();

        long sensorCount = fields.stream()
                .mapToLong(f -> sensorRepository.findByFieldId(f.getId()).size())
                .sum();

        double soilMoisture = averageSoilMoisture(fields.stream().map(f -> f.getId()).toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFarms", farms.size());
        stats.put("farmsChangePercent", 20);
        stats.put("totalFields", fields.size());
        stats.put("fieldsChangePercent", 16);
        stats.put("totalCrops", crops.size());
        stats.put("cropsChangePercent", 12);
        stats.put("totalAreaAcres", roundedArea);
        stats.put("totalArea", roundedArea);
        stats.put("healthyFields", healthyFields);
        stats.put("moderateFields", moderateFields);
        stats.put("attentionFields", attentionFields);
        stats.put("activeSensors", sensorCount);
        stats.put("unreadAlerts", unreadAlerts);
        stats.put("pendingTasks", unreadAlerts > 0 ? unreadAlerts : 4);
        stats.put("soilMoisture", soilMoisture);
        stats.put("moistureChangePercent", -5);
        stats.put("cropHealthScore", fields.isEmpty() ? 100 :
                Math.round((healthyFields * 100.0 / fields.size()) * 10.0) / 10.0);
        return stats;
    }

    private double averageSoilMoisture(List<Long> fieldIds) {
        List<Double> values = new ArrayList<>();
        for (Long fieldId : fieldIds) {
            for (Sensor sensor : sensorRepository.findByFieldId(fieldId)) {
                if (sensor.getSensorType() == null
                        || !sensor.getSensorType().toLowerCase().contains("moisture")) {
                    continue;
                }
                List<SensorReading> readings =
                        sensorReadingRepository.findTop50BySensorIdOrderByRecordedAtDesc(sensor.getId());
                if (!readings.isEmpty()) {
                    values.add(readings.get(0).getValue());
                }
            }
        }
        if (values.isEmpty()) {
            return 42.0;
        }
        double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(42.0);
        return Math.round(avg * 10.0) / 10.0;
    }
}

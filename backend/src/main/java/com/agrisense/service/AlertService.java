package com.agrisense.service;

import com.agrisense.dto.AlertDto;
import com.agrisense.entity.Alert;
import com.agrisense.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<AlertDto> getAlerts() {
        Long userId = currentUserService.getCurrentUserId();
        return alertRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    private AlertDto toDto(Alert alert) {
        return AlertDto.builder()
                .id(alert.getId())
                .title(alert.getTitle())
                .description(alert.getDescription())
                .severity(alert.getSeverity())
                .type(alert.getType())
                .read(alert.isRead())
                .timestamp(alert.getTimestamp())
                .build();
    }
}

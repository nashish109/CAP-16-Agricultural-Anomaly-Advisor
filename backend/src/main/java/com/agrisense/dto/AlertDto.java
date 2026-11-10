package com.agrisense.dto;

import com.agrisense.entity.AlertSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertDto {

    private Long id;
    private String title;
    private String description;
    private AlertSeverity severity;
    private String type;
    private boolean read;
    private Instant timestamp;
}

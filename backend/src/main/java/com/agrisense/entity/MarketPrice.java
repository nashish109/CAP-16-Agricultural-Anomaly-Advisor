package com.agrisense.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "market_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPrice extends BaseEntity {

    @Column(nullable = false)
    private String cropName;

    @Column(nullable = false)
    private Double pricePerKg;

    @Builder.Default
    private String currency = "LKR";

    private Double changePercent;

    private String market;

    @Column(nullable = false)
    private Instant recordedAt;
}

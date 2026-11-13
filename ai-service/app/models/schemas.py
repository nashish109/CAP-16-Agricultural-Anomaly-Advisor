
"""Request and response schemas for CAP-16 agricultural data processing."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class CropRecord(BaseModel):
    """One agricultural plot observation."""

    farm_id: str = Field(..., min_length=1)
    plot_id: str = Field(..., min_length=1)
    crop: str = Field(..., min_length=1)
    crop_variety: str | None = None
    season: str = Field(..., min_length=1)
    soil_type: str = Field(..., min_length=1)
    weather_condition: str | None = None

    # The numeric area is supplied in area_source_unit.
    # It will be converted to hectares during processing.
    area_hectares: float = Field(..., gt=0)
    area_source_unit: Literal["hectares", "acres"] = "hectares"

    sowing_date: date
    harvest_date: date | None = None
    harvest_weight_kg: float | None = Field(default=None, ge=0)

    # Input quantities are converted to canonical units during processing.
    fertilizer_kg: float = Field(..., ge=0)
    fertilizer_source_unit: Literal["kg", "g", "tonnes"] = "kg"

    seed_kg: float = Field(..., ge=0)
    seed_source_unit: Literal["kg", "g", "tonnes"] = "kg"

    water_liters: float = Field(..., ge=0)
    water_source_unit: Literal["liters", "milliliters", "cubic_meters"] = "liters"

    yield_tonnes_ha: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_crop_dates(self) -> "CropRecord":
        """Ensure harvest does not occur before sowing."""

        if (
            self.harvest_date is not None
            and self.harvest_date < self.sowing_date
        ):
            raise ValueError(
                "Harvest date cannot be earlier than sowing date."
            )

        return self


class DatasetProcessRequest(BaseModel):
    """Agricultural records submitted for processing."""

    records: list[CropRecord] = Field(..., min_length=1)


class RecordQualityResult(BaseModel):
    """Quality assessment for an individual agricultural record."""

    farm_id: str
    plot_id: str
    crop: str
    season: str
    quality_status: str
    quality_issues: list[str] = Field(default_factory=list)


class ProcessedAgriculturalRecord(CropRecord):
    """Validated agricultural record with normalized inputs and quality status."""

    fertilizer_kg_per_hectare: float
    seed_kg_per_hectare: float
    water_liters_per_hectare: float

    quality_status: str
    quality_issues: list[str] = Field(default_factory=list)


class DatasetProcessResponse(BaseModel):
    """Structured summary of agricultural dataset processing."""

    status: str
    total_records: int
    valid_records: int
    complete_records: int
    incomplete_records: int
    duplicate_records: int
    records_with_missing_harvest: int
    records_with_missing_yield: int

    average_fertilizer_kg_per_hectare: float
    average_seed_kg_per_hectare: float
    average_water_liters_per_hectare: float

    record_quality: list[RecordQualityResult]
    processed_records: list[ProcessedAgriculturalRecord]

    message: str

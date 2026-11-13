
"""Pandas and NumPy processing engine for CAP-16."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.models.schemas import (
    DatasetProcessRequest,
    DatasetProcessResponse,
    ProcessedAgriculturalRecord,
    RecordQualityResult,
)


def process_agricultural_dataset(
    request: DatasetProcessRequest,
) -> DatasetProcessResponse:
    """Validate, normalize and assess agricultural records."""

    records = [
        record.model_dump(mode="json")
        for record in request.records
    ]

    dataframe = pd.DataFrame(records)
    total_records = len(dataframe)

    # Step 1: Convert plot area into hectares.
    area_factors = {
        "hectares": 1.0,
        "acres": 0.4046856422,
    }

    dataframe["area_hectares"] = (
        dataframe["area_hectares"]
        * dataframe["area_source_unit"].map(area_factors)
    )

    # Step 2: Convert fertilizer and seed quantities into kilograms.
    weight_factors = {
        "kg": 1.0,
        "g": 0.001,
        "tonnes": 1000.0,
    }

    dataframe["fertilizer_kg"] = (
        dataframe["fertilizer_kg"]
        * dataframe["fertilizer_source_unit"].map(weight_factors)
    )

    dataframe["seed_kg"] = (
        dataframe["seed_kg"]
        * dataframe["seed_source_unit"].map(weight_factors)
    )

    # Step 3: Convert water quantities into litres.
    water_factors = {
        "liters": 1.0,
        "milliliters": 0.001,
        "cubic_meters": 1000.0,
    }

    dataframe["water_liters"] = (
        dataframe["water_liters"]
        * dataframe["water_source_unit"].map(water_factors)
    )

    # Step 4: Derive yield when harvest weight is available.
    # Yield (tonnes/hectare) = harvest weight (kg) / 1000 / area (ha).
    missing_yield = dataframe["yield_tonnes_ha"].isna()
    available_harvest_weight = dataframe["harvest_weight_kg"].notna()

    derive_yield_mask = missing_yield & available_harvest_weight

    dataframe.loc[derive_yield_mask, "yield_tonnes_ha"] = (
        dataframe.loc[derive_yield_mask, "harvest_weight_kg"]
        / 1000
        / dataframe.loc[derive_yield_mask, "area_hectares"]
    )

    # Step 5: Calculate normalized input consumption per hectare.
    dataframe["fertilizer_kg_per_hectare"] = (
        dataframe["fertilizer_kg"] / dataframe["area_hectares"]
    )

    dataframe["seed_kg_per_hectare"] = (
        dataframe["seed_kg"] / dataframe["area_hectares"]
    )

    dataframe["water_liters_per_hectare"] = (
        dataframe["water_liters"] / dataframe["area_hectares"]
    )

    # Step 6: Identify missing information.
    missing_harvest = dataframe["harvest_date"].isna()
    missing_yield = dataframe["yield_tonnes_ha"].isna()
    incomplete_mask = missing_harvest | missing_yield

    # Identify duplicate agricultural observations.
    duplicate_mask = dataframe.duplicated(
        subset=[
            "farm_id",
            "plot_id",
            "crop",
            "season",
            "sowing_date",
        ],
        keep="first",
    )

    records_with_missing_harvest = int(missing_harvest.sum())
    records_with_missing_yield = int(missing_yield.sum())
    incomplete_records = int(incomplete_mask.sum())
    duplicate_records = int(duplicate_mask.sum())
    complete_records = total_records - incomplete_records

    valid_records = int(
        (~incomplete_mask & ~duplicate_mask).sum()
    )

    # Step 7: Calculate aggregate averages using only complete,
    # non-duplicate records.
    analysis_dataframe = dataframe.loc[
        ~incomplete_mask & ~duplicate_mask
    ].copy()

    def calculate_mean(column: str) -> float:
        """Calculate a mean safely, returning zero when no data exists."""

        values = analysis_dataframe[column].dropna()

        if values.empty:
            return 0.0

        return float(np.mean(values.to_numpy()))

    fertilizer_per_hectare_mean = calculate_mean(
        "fertilizer_kg_per_hectare"
    )

    seed_per_hectare_mean = calculate_mean(
        "seed_kg_per_hectare"
    )

    water_per_hectare_mean = calculate_mean(
        "water_liters_per_hectare"
    )

    available_yields = (
        analysis_dataframe["yield_tonnes_ha"].dropna()
    )

    yield_mean = (
        float(np.mean(available_yields.to_numpy()))
        if not available_yields.empty
        else None
    )

    # Step 8: Generate record-level quality and processed outputs.
    record_quality = []
    processed_records = []

    for index, row in dataframe.iterrows():
        quality_issues = []

        if pd.isna(row["harvest_date"]):
            quality_issues.append("Missing harvest date")

        if pd.isna(row["yield_tonnes_ha"]):
            quality_issues.append("Missing crop yield")

        is_duplicate = bool(duplicate_mask.iloc[index])

        if is_duplicate:
            quality_issues.append(
                "Duplicate agricultural observation"
            )

        if is_duplicate:
            quality_status = "DUPLICATE"
        elif quality_issues:
            quality_status = "INCOMPLETE"
        else:
            quality_status = "VALID"

        record_quality.append(
            RecordQualityResult(
                farm_id=str(row["farm_id"]),
                plot_id=str(row["plot_id"]),
                crop=str(row["crop"]),
                season=str(row["season"]),
                quality_status=quality_status,
                quality_issues=quality_issues,
            )
        )

        # Store canonical values while retaining source-unit labels.
        processed_record_data = records[index].copy()

        processed_record_data.update(
            {
                "area_hectares": float(row["area_hectares"]),
                "fertilizer_kg": float(row["fertilizer_kg"]),
                "seed_kg": float(row["seed_kg"]),
                "water_liters": float(row["water_liters"]),
                "yield_tonnes_ha": (
                    float(row["yield_tonnes_ha"])
                    if pd.notna(row["yield_tonnes_ha"])
                    else None
                ),
                "fertilizer_kg_per_hectare": float(
                    row["fertilizer_kg_per_hectare"]
                ),
                "seed_kg_per_hectare": float(
                    row["seed_kg_per_hectare"]
                ),
                "water_liters_per_hectare": float(
                    row["water_liters_per_hectare"]
                ),
                "quality_status": quality_status,
                "quality_issues": quality_issues,
            }
        )

        processed_records.append(
            ProcessedAgriculturalRecord.model_validate(
                processed_record_data
            )
        )

    # Step 9: Generate processing summary.
    message = (
        f"Processed {total_records} agricultural records. "
        f"{complete_records} complete records, "
        f"{incomplete_records} incomplete records, and "
        f"{duplicate_records} duplicate observations were identified. "
        f"{records_with_missing_harvest} records have missing harvest dates. "
        f"Aggregate averages use complete, non-duplicate records only. "
        f"Average fertilizer consumption: "
        f"{fertilizer_per_hectare_mean:.2f} kg/ha; "
        f"average seed consumption: "
        f"{seed_per_hectare_mean:.2f} kg/ha; "
        f"average water consumption: "
        f"{water_per_hectare_mean:.2f} liters/ha."
    )

    if yield_mean is not None:
        message += (
            f" Average available yield: "
            f"{yield_mean:.2f} tonnes/ha."
        )
    else:
        message += " No yield values are available."

    return DatasetProcessResponse(
        status="success",
        total_records=total_records,
        valid_records=valid_records,
        complete_records=complete_records,
        incomplete_records=incomplete_records,
        duplicate_records=duplicate_records,
        records_with_missing_harvest=records_with_missing_harvest,
        records_with_missing_yield=records_with_missing_yield,
        average_fertilizer_kg_per_hectare=(
            fertilizer_per_hectare_mean
        ),
        average_seed_kg_per_hectare=seed_per_hectare_mean,
        average_water_liters_per_hectare=(
            water_per_hectare_mean
        ),
        record_quality=record_quality,
        processed_records=processed_records,
        message=message,
    )

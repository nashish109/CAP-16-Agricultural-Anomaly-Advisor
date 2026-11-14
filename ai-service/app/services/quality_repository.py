
"""Read-only Snowflake repository for CAP-16 data quality reports."""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from app.services.snowflake_client import get_snowflake_connection


def _fetch_all(cursor) -> list[dict[str, Any]]:
    rows = cursor.fetchall()
    columns = [column[0].lower() for column in cursor.description]

    return [
        dict(zip(columns, row))
        for row in rows
    ]


def _normalize(value: Any) -> Any:
    """Convert Snowflake values into JSON-compatible Python values."""

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")

    return value


def _normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize individual Snowflake record values."""

    normalized = {
        key: _normalize(value)
        for key, value in record.items()
    }

    issues = normalized.get("quality_issues")

    if isinstance(issues, str):
        try:
            issues = json.loads(issues)
        except (json.JSONDecodeError, TypeError):
            issues = []

    if not isinstance(issues, list):
        issues = []

    normalized["quality_issues"] = issues

    return normalized


def get_quality_report(
    owner_user_id: int | None = None,
    batch_id: str | None = None,
) -> dict[str, Any]:
    """
    Retrieve a quality report from Snowflake.

    owner_user_id:
        Positive owner ID restricts results to one farmer.
        None allows authorized cross-farm reporting.

    batch_id:
        Optional batch identifier restricts the report to one upload.
    """

    if owner_user_id is not None:
        if not isinstance(owner_user_id, int) or owner_user_id <= 0:
            raise ValueError("A valid owner_user_id is required.")

    if batch_id is not None:
        batch_id = batch_id.strip()

        if not batch_id:
            batch_id = None

    batch_conditions = []
    batch_params: list[Any] = []

    record_conditions = []
    record_params: list[Any] = []

    if owner_user_id is not None:
        batch_conditions.append("OWNER_USER_ID = %s")
        batch_params.append(owner_user_id)

        record_conditions.append("b.OWNER_USER_ID = %s")
        record_params.append(owner_user_id)

    if batch_id is not None:
        batch_conditions.append("BATCH_ID = %s")
        batch_params.append(batch_id)

        record_conditions.append("r.BATCH_ID = %s")
        record_params.append(batch_id)

    batch_where = (
        "WHERE " + " AND ".join(batch_conditions)
        if batch_conditions else ""
    )

    record_where = (
        "WHERE " + " AND ".join(record_conditions)
        if record_conditions else ""
    )

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            # 1. Dataset history and processing summaries.
            cursor.execute(
                f"""
                SELECT
                    BATCH_ID,
                    SOURCE_FILE_NAME,
                    PROCESSING_STATUS,
                    TOTAL_RECORDS,
                    VALID_RECORDS,
                    COMPLETE_RECORDS,
                    INCOMPLETE_RECORDS,
                    DUPLICATE_RECORDS,
                    RECORDS_WITH_MISSING_HARVEST,
                    RECORDS_WITH_MISSING_YIELD,
                    CREATED_AT
                FROM CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES
                {batch_where}
                ORDER BY CREATED_AT DESC
                LIMIT 100
                """,
                tuple(batch_params),
            )

            batches = [
                {
                    key: _normalize(value)
                    for key, value in batch.items()
                }
                for batch in _fetch_all(cursor)
            ]

            # 2. Actual persisted record-quality statistics.
            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS TOTAL_RECORDS,

                    COUNT_IF(r.QUALITY_STATUS = 'VALID')
                        AS VALID_RECORDS,

                    COUNT_IF(r.QUALITY_STATUS = 'INCOMPLETE')
                        AS INCOMPLETE_RECORDS,

                    COUNT_IF(r.QUALITY_STATUS = 'DUPLICATE')
                        AS DUPLICATE_RECORDS,

                    COUNT_IF(r.HARVEST_DATE IS NULL)
                        AS MISSING_HARVEST_DATES,

                    COUNT_IF(r.HARVEST_WEIGHT_KG IS NULL)
                        AS MISSING_HARVEST_WEIGHTS,

                    COUNT_IF(r.YIELD_TONNES_HA IS NULL)
                        AS MISSING_YIELDS,

                    COUNT_IF(r.CROP_VARIETY IS NULL)
                        AS MISSING_CROP_VARIETIES,

                    COUNT_IF(r.WEATHER_CONDITION IS NULL)
                        AS MISSING_WEATHER_CONDITIONS

                FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r

                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON r.BATCH_ID = b.BATCH_ID

                {record_where}
                """,
                tuple(record_params),
            )

            stats_rows = _fetch_all(cursor)
            stats = stats_rows[0] if stats_rows else {}

            nullable_fields = [
                "missing_harvest_dates",
                "missing_harvest_weights",
                "missing_yields",
                "missing_crop_varieties",
                "missing_weather_conditions",
            ]

            missing_values = sum(
                int(stats.get(field) or 0)
                for field in nullable_fields
            )

            total_records = int(stats.get("total_records") or 0)

            nullable_cell_count = total_records * len(nullable_fields)

            completeness_percentage = (
                (
                    (nullable_cell_count - missing_values)
                    / nullable_cell_count
                ) * 100
                if nullable_cell_count else 100.0
            )

            valid_records = int(stats.get("valid_records") or 0)

            quality_score = (
                (valid_records / total_records) * 100
                if total_records else 0.0
            )

            summary = {
                "total_records": total_records,
                "valid_records": valid_records,
                "incomplete_records": int(
                    stats.get("incomplete_records") or 0
                ),
                "duplicate_records": int(
                    stats.get("duplicate_records") or 0
                ),
                "missing_values": missing_values,
                "missing_harvest_dates": int(
                    stats.get("missing_harvest_dates") or 0
                ),
                "missing_harvest_weights": int(
                    stats.get("missing_harvest_weights") or 0
                ),
                "missing_yields": int(
                    stats.get("missing_yields") or 0
                ),
                "missing_crop_varieties": int(
                    stats.get("missing_crop_varieties") or 0
                ),
                "missing_weather_conditions": int(
                    stats.get("missing_weather_conditions") or 0
                ),
                "nullable_fields_checked": len(nullable_fields),
                "nullable_cells_checked": nullable_cell_count,
                "completeness_percentage": round(
                    completeness_percentage, 2
                ),
                "quality_score": round(quality_score, 2),
            }

            # 3. Crop distribution.
            cursor.execute(
                f"""
                SELECT
                    r.CROP,
                    COUNT(*) AS RECORD_COUNT
                FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r
                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON r.BATCH_ID = b.BATCH_ID
                {record_where}
                GROUP BY r.CROP
                ORDER BY RECORD_COUNT DESC, r.CROP
                """,
                tuple(record_params),
            )

            crop_distribution = [
                {
                    "crop": str(row["crop"]),
                    "count": int(row["record_count"]),
                }
                for row in _fetch_all(cursor)
            ]

            # 4. Individual records.
            # The UI receives at most 5,000 records per report.
            cursor.execute(
                f"""
                SELECT
                    r.RECORD_ID,
                    r.BATCH_ID,
                    r.FARM_ID,
                    r.PLOT_ID,
                    r.CROP,
                    r.CROP_VARIETY,
                    r.SEASON,
                    r.SOIL_TYPE,
                    r.WEATHER_CONDITION,
                    r.AREA_HECTARES,
                    r.AREA_SOURCE_UNIT,
                    r.SOWING_DATE,
                    r.HARVEST_DATE,
                    r.HARVEST_WEIGHT_KG,
                    r.FERTILIZER_KG,
                    r.FERTILIZER_SOURCE_UNIT,
                    r.SEED_KG,
                    r.SEED_SOURCE_UNIT,
                    r.WATER_LITERS,
                    r.WATER_SOURCE_UNIT,
                    r.YIELD_TONNES_HA,
                    r.QUALITY_STATUS,
                    r.QUALITY_ISSUES,
                    r.SOURCE_FILE_NAME
                FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r
                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON r.BATCH_ID = b.BATCH_ID
                {record_where}
                ORDER BY r.BATCH_ID DESC, r.RECORD_ID
                LIMIT 5000
                """,
                tuple(record_params),
            )

            records = [
                _normalize_record(record)
                for record in _fetch_all(cursor)
            ]

            return {
                "batches": batches,
                "selected_batch_id": batch_id,
                "summary": summary,
                "crop_distribution": crop_distribution,
                "records": records,
                "records_returned": len(records),
                "records_truncated": total_records > len(records),
            }

        finally:
            cursor.close()

    finally:
        connection.close()

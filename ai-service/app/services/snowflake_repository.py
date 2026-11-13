
"""Snowflake persistence layer for CAP-16."""

import json
import logging
from uuid import uuid4

from app.services.snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)


def save_processed_dataset(
    result,
    source_file_name: str,
    owner_user_id: int,
) -> str:
    """Save processed records and batch summary in one transaction."""

    if not isinstance(owner_user_id, int) or owner_user_id <= 0:
        raise ValueError("A valid owner_user_id is required.")

    batch_id = str(uuid4())
    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            # Insert normalized agricultural records.
            # INSERT ... SELECT allows PARSE_JSON() to be evaluated
            # as a SELECT expression rather than inside VALUES.

            record_sql = """
                INSERT INTO CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS (
                    RECORD_ID,
                    BATCH_ID,
                    FARM_ID,
                    PLOT_ID,
                    CROP,
                    CROP_VARIETY,
                    SEASON,
                    SOIL_TYPE,
                    WEATHER_CONDITION,
                    AREA_HECTARES,
                    AREA_SOURCE_UNIT,
                    SOWING_DATE,
                    HARVEST_DATE,
                    HARVEST_WEIGHT_KG,
                    FERTILIZER_KG,
                    FERTILIZER_SOURCE_UNIT,
                    SEED_KG,
                    SEED_SOURCE_UNIT,
                    WATER_LITERS,
                    WATER_SOURCE_UNIT,
                    YIELD_TONNES_HA,
                    FERTILIZER_KG_PER_HECTARE,
                    SEED_KG_PER_HECTARE,
                    WATER_LITERS_PER_HECTARE,
                    QUALITY_STATUS,
                    QUALITY_ISSUES,
                    SOURCE_FILE_NAME
                )
                SELECT
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    PARSE_JSON(%s), %s
            """

            record_values = []

            for record in result.processed_records:
                record_values.append(
                    (
                        str(uuid4()),
                        batch_id,
                        record.farm_id,
                        record.plot_id,
                        record.crop,
                        record.crop_variety,
                        record.season,
                        record.soil_type,
                        record.weather_condition,
                        record.area_hectares,
                        record.area_source_unit,
                        record.sowing_date,
                        record.harvest_date,
                        record.harvest_weight_kg,
                        record.fertilizer_kg,
                        record.fertilizer_source_unit,
                        record.seed_kg,
                        record.seed_source_unit,
                        record.water_liters,
                        record.water_source_unit,
                        record.yield_tonnes_ha,
                        record.fertilizer_kg_per_hectare,
                        record.seed_kg_per_hectare,
                        record.water_liters_per_hectare,
                        record.quality_status,
                        json.dumps(record.quality_issues),
                        source_file_name,
                    )
                )

            for values in record_values:
                cursor.execute(record_sql, values)

            # Insert dataset batch summary.

            batch_sql = """
                INSERT INTO CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES (
                    BATCH_ID,
                    OWNER_USER_ID,
                    SOURCE_FILE_NAME,
                    PROCESSING_STATUS,
                    TOTAL_RECORDS,
                    VALID_RECORDS,
                    COMPLETE_RECORDS,
                    INCOMPLETE_RECORDS,
                    DUPLICATE_RECORDS,
                    RECORDS_WITH_MISSING_HARVEST,
                    RECORDS_WITH_MISSING_YIELD,
                    AVERAGE_FERTILIZER_KG_PER_HECTARE,
                    AVERAGE_SEED_KG_PER_HECTARE,
                    AVERAGE_WATER_LITERS_PER_HECTARE,
                    PROCESSING_MESSAGE
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
            """

            batch_values = (
                batch_id,
                owner_user_id,
                source_file_name,
                "SUCCESS",
                result.total_records,
                result.valid_records,
                result.complete_records,
                result.incomplete_records,
                result.duplicate_records,
                result.records_with_missing_harvest,
                result.records_with_missing_yield,
                result.average_fertilizer_kg_per_hectare,
                result.average_seed_kg_per_hectare,
                result.average_water_liters_per_hectare,
                result.message,
            )

            cursor.execute(batch_sql, batch_values)

            # Commit records and batch summary together.

            connection.commit()

            logger.info(
                "Successfully saved %s agricultural records "
                "to Snowflake. Batch ID: %s | Owner ID: %s",
                len(record_values),
                batch_id,
                owner_user_id,
            )

            return batch_id

        except Exception:
            connection.rollback()

            logger.exception(
                "Snowflake persistence failed for batch %s.",
                batch_id,
            )

            raise

        finally:
            cursor.close()

    finally:
        connection.close()

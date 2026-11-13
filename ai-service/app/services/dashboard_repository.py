
"""Read-only Snowflake analytics repository for CAP-16 dashboards."""

from app.services.snowflake_client import get_snowflake_connection


def _fetch_one(cursor):
    row = cursor.fetchone()

    if row is None:
        return {}

    columns = [column[0].lower() for column in cursor.description]
    return dict(zip(columns, row))


def _fetch_all(cursor):
    rows = cursor.fetchall()
    columns = [column[0].lower() for column in cursor.description]

    return [
        dict(zip(columns, row))
        for row in rows
    ]


def get_dashboard_analytics(owner_user_id: int | None = None) -> dict:
    """
    Retrieve dashboard analytics from Snowflake.

    A positive owner_user_id retrieves only that user's data.
    None retrieves cross-user analytics for an authorized Analyst.

    Role authorization must be enforced by the calling backend.
    """

    if owner_user_id is not None:
        if not isinstance(owner_user_id, int) or owner_user_id <= 0:
            raise ValueError("A valid owner_user_id is required.")

    batch_filter = ""
    batch_params = ()

    record_filter = ""
    record_params = ()

    anomaly_filter = ""
    anomaly_params = ()

    if owner_user_id is not None:
        batch_filter = "WHERE OWNER_USER_ID = %s"
        batch_params = (owner_user_id,)

        record_filter = "WHERE b.OWNER_USER_ID = %s"
        record_params = (owner_user_id,)

        anomaly_filter = "WHERE b.OWNER_USER_ID = %s"
        anomaly_params = (owner_user_id,)

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            # 1. Dataset statistics.
            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS TOTAL_DATASETS,
                    COALESCE(SUM(TOTAL_RECORDS), 0) AS TOTAL_RECORDS,
                    COALESCE(SUM(VALID_RECORDS), 0) AS VALID_RECORDS,
                    COALESCE(SUM(COMPLETE_RECORDS), 0) AS COMPLETE_RECORDS,
                    COALESCE(SUM(INCOMPLETE_RECORDS), 0) AS INCOMPLETE_RECORDS,
                    COALESCE(SUM(DUPLICATE_RECORDS), 0) AS DUPLICATE_RECORDS,
                    COALESCE(SUM(RECORDS_WITH_MISSING_HARVEST), 0)
                        AS MISSING_HARVEST_RECORDS,
                    COALESCE(SUM(RECORDS_WITH_MISSING_YIELD), 0)
                        AS MISSING_YIELD_RECORDS,
                    AVG(AVERAGE_FERTILIZER_KG_PER_HECTARE)
                        AS AVG_FERTILIZER_KG_PER_HECTARE,
                    AVG(AVERAGE_SEED_KG_PER_HECTARE)
                        AS AVG_SEED_KG_PER_HECTARE,
                    AVG(AVERAGE_WATER_LITERS_PER_HECTARE)
                        AS AVG_WATER_LITERS_PER_HECTARE
                FROM CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES
                {batch_filter}
                """,
                batch_params,
            )

            dataset_stats = _fetch_one(cursor)

            # 2. Agricultural record statistics.
            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS TOTAL_AGRICULTURAL_RECORDS,
                    COUNT_IF(QUALITY_STATUS = 'VALID')
                        AS VALID_QUALITY_RECORDS,
                    COUNT_IF(QUALITY_STATUS <> 'VALID')
                        AS NON_VALID_QUALITY_RECORDS,
                    AVG(YIELD_TONNES_HA) AS AVG_YIELD_TONNES_HA,
                    AVG(FERTILIZER_KG_PER_HECTARE)
                        AS AVG_FERTILIZER_KG_PER_HECTARE,
                    AVG(SEED_KG_PER_HECTARE)
                        AS AVG_SEED_KG_PER_HECTARE,
                    AVG(WATER_LITERS_PER_HECTARE)
                        AS AVG_WATER_LITERS_PER_HECTARE
                FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r
                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON r.BATCH_ID = b.BATCH_ID
                {record_filter}
                """,
                record_params,
            )

            record_stats = _fetch_one(cursor)

            # 3. Anomaly distribution.
            cursor.execute(
                f"""
                SELECT
                    a.SEVERITY,
                    a.ANOMALY_TYPE,
                    COUNT(*) AS ANOMALY_COUNT
                FROM CAP16_ANALYTICS.AGRICULTURE.ANOMALY_RESULTS a
                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON a.BATCH_ID = b.BATCH_ID
                {anomaly_filter}
                GROUP BY a.SEVERITY, a.ANOMALY_TYPE
                ORDER BY a.SEVERITY, a.ANOMALY_TYPE
                """,
                anomaly_params,
            )

            anomaly_distribution = _fetch_all(cursor)

            # 4. Recent datasets.
            cursor.execute(
                f"""
                SELECT
                    BATCH_ID,
                    SOURCE_FILE_NAME,
                    PROCESSING_STATUS,
                    TOTAL_RECORDS,
                    VALID_RECORDS,
                    INCOMPLETE_RECORDS,
                    DUPLICATE_RECORDS,
                    CREATED_AT
                FROM CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES
                {batch_filter}
                ORDER BY CREATED_AT DESC
                LIMIT 10
                """,
                batch_params,
            )

            recent_datasets = _fetch_all(cursor)

            # 5. Recent anomalies.
            cursor.execute(
                f"""
                SELECT
                    a.ANOMALY_ID,
                    a.BATCH_ID,
                    a.FARM_ID,
                    a.PLOT_ID,
                    a.CROP,
                    a.SEASON,
                    a.ANOMALY_TYPE,
                    a.METRIC_NAME,
                    a.OBSERVED_VALUE,
                    a.EXPECTED_VALUE,
                    a.DEVIATION_PERCENTAGE,
                    a.SEVERITY,
                    a.EXPLANATION,
                    a.DETECTED_AT
                FROM CAP16_ANALYTICS.AGRICULTURE.ANOMALY_RESULTS a
                JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON a.BATCH_ID = b.BATCH_ID
                {anomaly_filter}
                ORDER BY a.DETECTED_AT DESC
                LIMIT 10
                """,
                anomaly_params,
            )

            recent_anomalies = _fetch_all(cursor)

            return {
                "datasets": dataset_stats,
                "records": record_stats,
                "anomaly_distribution": anomaly_distribution,
                "recent_datasets": recent_datasets,
                "recent_anomalies": recent_anomalies,
            }

        finally:
            cursor.close()

    finally:
        connection.close()

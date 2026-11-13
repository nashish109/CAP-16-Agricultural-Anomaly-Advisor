
"""Ownership-aware, independent-plot agricultural anomaly detection for CAP-16."""

import logging

from app.services.snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)

MINIMUM_PEERS = 3

ANOMALY_DETECTION_SQL = f"""
INSERT INTO CAP16_ANALYTICS.AGRICULTURE.ANOMALY_RESULTS (
    ANOMALY_ID,
    BATCH_ID,
    RECORD_ID,
    FARM_ID,
    PLOT_ID,
    CROP,
    SEASON,
    SOIL_TYPE,
    ANOMALY_TYPE,
    METRIC_NAME,
    OBSERVED_VALUE,
    EXPECTED_VALUE,
    DEVIATION_PERCENTAGE,
    SEVERITY,
    EXPLANATION
)

WITH owned_valid_records AS (
    SELECT
        r.*,
        b.OWNER_USER_ID
    FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r
    INNER JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
        ON r.BATCH_ID = b.BATCH_ID
    WHERE r.QUALITY_STATUS = 'VALID'
      AND b.OWNER_USER_ID IS NOT NULL
),

target_records AS (
    SELECT *
    FROM owned_valid_records
    WHERE BATCH_ID = %s
      AND OWNER_USER_ID = %s
),

-- Collapse repeated uploads into one observation per independent plot.
-- AVG is used as the representative value. The observed repeated uploads
-- in the current validation dataset have identical metric values.
peer_plot_metrics AS (
    SELECT
        OWNER_USER_ID,
        FARM_ID,
        PLOT_ID,
        CROP,
        CROP_VARIETY,
        SEASON,
        SOIL_TYPE,

        AVG(FERTILIZER_KG_PER_HECTARE)
            AS FERTILIZER_VALUE,

        AVG(WATER_LITERS_PER_HECTARE)
            AS WATER_VALUE,

        AVG(YIELD_TONNES_HA)
            AS YIELD_VALUE

    FROM owned_valid_records
    WHERE FARM_ID IS NOT NULL
      AND PLOT_ID IS NOT NULL

    GROUP BY
        OWNER_USER_ID,
        FARM_ID,
        PLOT_ID,
        CROP,
        CROP_VARIETY,
        SEASON,
        SOIL_TYPE
),

-- Every peer count and median is calculated across independent plots,
-- not across individual upload records.
peer_stats AS (
    SELECT
        t.RECORD_ID,

        COUNT(p.PLOT_ID) AS PEER_COUNT,

        COUNT(p.FERTILIZER_VALUE)
            AS FERTILIZER_PEER_COUNT,

        COUNT(p.WATER_VALUE)
            AS WATER_PEER_COUNT,

        COUNT(p.YIELD_VALUE)
            AS YIELD_PEER_COUNT,

        MEDIAN(p.FERTILIZER_VALUE)
            AS MEDIAN_FERTILIZER,

        MEDIAN(p.WATER_VALUE)
            AS MEDIAN_WATER,

        MEDIAN(p.YIELD_VALUE)
            AS MEDIAN_YIELD

    FROM target_records t

    LEFT JOIN peer_plot_metrics p
        ON p.OWNER_USER_ID = t.OWNER_USER_ID

       -- Never compare a plot against another upload of itself.
       AND NOT (
           EQUAL_NULL(p.FARM_ID, t.FARM_ID)
           AND EQUAL_NULL(p.PLOT_ID, t.PLOT_ID)
       )

       -- Require matching agricultural context.
       AND p.CROP = t.CROP
       AND EQUAL_NULL(p.CROP_VARIETY, t.CROP_VARIETY)
       AND p.SEASON = t.SEASON
       AND p.SOIL_TYPE = t.SOIL_TYPE

    GROUP BY t.RECORD_ID
),

metric_candidates AS (

    -- Excess fertilizer consumption.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'EXCESS_FERTILIZER' AS ANOMALY_TYPE,
        'FERTILIZER_KG_PER_HECTARE' AS METRIC_NAME,
        t.FERTILIZER_KG_PER_HECTARE AS OBSERVED_VALUE,
        p.MEDIAN_FERTILIZER AS EXPECTED_VALUE,
        p.FERTILIZER_PEER_COUNT AS PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.FERTILIZER_PEER_COUNT >= {MINIMUM_PEERS}
      AND t.FERTILIZER_KG_PER_HECTARE IS NOT NULL
      AND p.MEDIAN_FERTILIZER > 0
      AND t.FERTILIZER_KG_PER_HECTARE
            > p.MEDIAN_FERTILIZER * 1.30

    UNION ALL

    -- Excess water consumption.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'EXCESS_WATER',
        'WATER_LITERS_PER_HECTARE',
        t.WATER_LITERS_PER_HECTARE,
        p.MEDIAN_WATER,
        p.WATER_PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.WATER_PEER_COUNT >= {MINIMUM_PEERS}
      AND t.WATER_LITERS_PER_HECTARE IS NOT NULL
      AND p.MEDIAN_WATER > 0
      AND t.WATER_LITERS_PER_HECTARE
            > p.MEDIAN_WATER * 1.30

    UNION ALL

    -- Lower-than-expected crop yield.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'LOW_CROP_YIELD',
        'YIELD_TONNES_HA',
        t.YIELD_TONNES_HA,
        p.MEDIAN_YIELD,
        p.YIELD_PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.YIELD_PEER_COUNT >= {MINIMUM_PEERS}
      AND t.YIELD_TONNES_HA IS NOT NULL
      AND p.MEDIAN_YIELD > 0
      AND t.YIELD_TONNES_HA
            < p.MEDIAN_YIELD * 0.70

    UNION ALL

    -- Insufficient independent peers for fertilizer.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'INSUFFICIENT_DATA',
        'FERTILIZER_KG_PER_HECTARE',
        t.FERTILIZER_KG_PER_HECTARE,
        p.MEDIAN_FERTILIZER,
        p.FERTILIZER_PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.FERTILIZER_PEER_COUNT < {MINIMUM_PEERS}
       OR t.FERTILIZER_KG_PER_HECTARE IS NULL
       OR p.MEDIAN_FERTILIZER IS NULL
       OR p.MEDIAN_FERTILIZER <= 0

    UNION ALL

    -- Insufficient independent peers for water.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'INSUFFICIENT_DATA',
        'WATER_LITERS_PER_HECTARE',
        t.WATER_LITERS_PER_HECTARE,
        p.MEDIAN_WATER,
        p.WATER_PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.WATER_PEER_COUNT < {MINIMUM_PEERS}
       OR t.WATER_LITERS_PER_HECTARE IS NULL
       OR p.MEDIAN_WATER IS NULL
       OR p.MEDIAN_WATER <= 0

    UNION ALL

    -- Insufficient independent peers for yield.
    SELECT
        t.BATCH_ID,
        t.RECORD_ID,
        t.FARM_ID,
        t.PLOT_ID,
        t.CROP,
        t.SEASON,
        t.SOIL_TYPE,
        'INSUFFICIENT_DATA',
        'YIELD_TONNES_HA',
        t.YIELD_TONNES_HA,
        p.MEDIAN_YIELD,
        p.YIELD_PEER_COUNT

    FROM target_records t
    INNER JOIN peer_stats p
        ON p.RECORD_ID = t.RECORD_ID

    WHERE p.YIELD_PEER_COUNT < {MINIMUM_PEERS}
       OR t.YIELD_TONNES_HA IS NULL
       OR p.MEDIAN_YIELD IS NULL
       OR p.MEDIAN_YIELD <= 0
),

-- Insufficient-data assessments must not expose preliminary peer medians
-- or calculated deviations as reliable analytical benchmarks.
deviations AS (
    SELECT
        *,
        CASE
            WHEN ANOMALY_TYPE = 'INSUFFICIENT_DATA'
                THEN NULL
            WHEN EXPECTED_VALUE > 0
                THEN (
                    (OBSERVED_VALUE - EXPECTED_VALUE)
                    / EXPECTED_VALUE
                ) * 100
            ELSE NULL
        END AS DEVIATION_PERCENTAGE

    FROM metric_candidates
)

SELECT
    UUID_STRING(),
    d.BATCH_ID,
    d.RECORD_ID,
    d.FARM_ID,
    d.PLOT_ID,
    d.CROP,
    d.SEASON,
    d.SOIL_TYPE,
    d.ANOMALY_TYPE,
    d.METRIC_NAME,
    d.OBSERVED_VALUE,

    CASE
        WHEN d.ANOMALY_TYPE = 'INSUFFICIENT_DATA'
            THEN NULL
        ELSE d.EXPECTED_VALUE
    END,

    d.DEVIATION_PERCENTAGE,

    CASE
        WHEN d.ANOMALY_TYPE = 'INSUFFICIENT_DATA'
            THEN 'INFO'
        WHEN ABS(d.DEVIATION_PERCENTAGE) >= 50
            THEN 'HIGH'
        ELSE 'MEDIUM'
    END,

    CASE
        WHEN d.ANOMALY_TYPE = 'INSUFFICIENT_DATA'
             AND d.PEER_COUNT < {MINIMUM_PEERS}
            THEN
                'Insufficient comparable independent plots. Found '
                || d.PEER_COUNT
                || ' eligible independent peer plots; at least '
                || '{MINIMUM_PEERS}'
                || ' are required.'

        WHEN d.ANOMALY_TYPE = 'INSUFFICIENT_DATA'
             AND d.OBSERVED_VALUE IS NULL
            THEN
                'The target record does not contain a usable value '
                || 'for this metric.'

        WHEN d.ANOMALY_TYPE = 'INSUFFICIENT_DATA'
            THEN
                'The comparable peer median is zero or unavailable. '
                || 'A relative deviation cannot be calculated reliably.'

        WHEN d.ANOMALY_TYPE = 'EXCESS_FERTILIZER'
            THEN
                'Fertilizer consumption is more than 30 percent above '
                || 'the median of independent comparable plots. '
                || 'Eligible peers: '
                || d.PEER_COUNT
                || '. This is an observed deviation, not proof of causation.'

        WHEN d.ANOMALY_TYPE = 'EXCESS_WATER'
            THEN
                'Water consumption is more than 30 percent above '
                || 'the median of independent comparable plots. '
                || 'Eligible peers: '
                || d.PEER_COUNT
                || '. This is an observed deviation, not proof of causation.'

        WHEN d.ANOMALY_TYPE = 'LOW_CROP_YIELD'
            THEN
                'Crop yield is more than 30 percent below '
                || 'the median of independent comparable plots. '
                || 'Eligible peers: '
                || d.PEER_COUNT
                || '. This is an observed deviation, not proof of causation.'
    END

FROM deviations d

WHERE NOT EXISTS (
    SELECT 1
    FROM CAP16_ANALYTICS.AGRICULTURE.ANOMALY_RESULTS existing
    WHERE existing.BATCH_ID = d.BATCH_ID
      AND existing.RECORD_ID = d.RECORD_ID
      AND existing.ANOMALY_TYPE = d.ANOMALY_TYPE
      AND existing.METRIC_NAME = d.METRIC_NAME
)
"""


def detect_anomalies(
    batch_id: str,
    owner_user_id: int,
) -> int:
    """
    Detect agricultural anomalies using independent comparable plots.

    Only valid records with identified ownership are considered.

    Repeated uploads of the same FARM_ID + PLOT_ID contribute one
    representative metric observation to peer medians.

    Returns the number of anomaly and insufficient-data assessments
    inserted into Snowflake.
    """

    if not batch_id or not isinstance(batch_id, str):
        raise ValueError("A valid Snowflake batch ID is required.")

    if (
        not isinstance(owner_user_id, int)
        or isinstance(owner_user_id, bool)
        or owner_user_id <= 0
    ):
        raise ValueError("A valid owner_user_id is required.")

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            # Verify that the requested batch belongs to this owner.
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES
                WHERE BATCH_ID = %s
                  AND OWNER_USER_ID = %s
                """,
                (batch_id, owner_user_id),
            )

            batch_count = cursor.fetchone()[0]

            if batch_count != 1:
                raise ValueError(
                    "The requested batch does not belong "
                    "to the supplied owner."
                )

            cursor.execute(
                ANOMALY_DETECTION_SQL,
                (batch_id, owner_user_id),
            )

            inserted_count = max(cursor.rowcount, 0)

            connection.commit()

            logger.info(
                "Independent-plot anomaly detection completed "
                "for batch %s and owner %s. Inserted %s assessments.",
                batch_id,
                owner_user_id,
                inserted_count,
            )

            return inserted_count

        except Exception:
            connection.rollback()

            logger.exception(
                "Independent-plot anomaly detection failed for batch %s.",
                batch_id,
            )
            raise

        finally:
            cursor.close()

    finally:
        connection.close()

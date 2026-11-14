"""Read-only Snowflake repository for CAP-16 anomaly assessments."""

from app.services.snowflake_client import get_snowflake_connection


def _fetch_all(cursor):
    rows = cursor.fetchall()
    columns = [column[0].lower() for column in cursor.description]

    return [
        dict(zip(columns, row))
        for row in rows
    ]


def _validate_owner(owner_user_id: int | None) -> None:
    if owner_user_id is not None:
        if (
            not isinstance(owner_user_id, int)
            or isinstance(owner_user_id, bool)
            or owner_user_id <= 0
        ):
            raise ValueError("A valid owner_user_id is required.")


def get_anomaly_batches(
    owner_user_id: int | None = None,
) -> list[dict]:
    """
    Return available dataset batches for the authorized user scope.

    A positive owner_user_id restricts results to that owner.
    None retrieves batches across owners for authorized Analysts/Admins.
    Batches are included even when they have no anomaly assessments.
    """

    _validate_owner(owner_user_id)

    owner_filter = ""
    params = ()

    if owner_user_id is not None:
        owner_filter = "WHERE OWNER_USER_ID = %s"
        params = (owner_user_id,)

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            cursor.execute(
                f"""
                SELECT
                    BATCH_ID,
                    SOURCE_FILE_NAME,
                    PROCESSING_STATUS,
                    TOTAL_RECORDS,
                    CREATED_AT
                FROM CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES
                {owner_filter}
                ORDER BY CREATED_AT DESC
                """,
                params,
            )

            return _fetch_all(cursor)

        finally:
            cursor.close()

    finally:
        connection.close()


def get_anomaly_assessments(
    owner_user_id: int | None = None,
    batch_id: str | None = None,
) -> list[dict]:
    """
    Retrieve anomaly and insufficient-data assessments.

    A positive owner_user_id restricts results to that owner.
    None retrieves cross-owner results for authorized Analysts/Admins.
    A batch_id optionally restricts results to one dataset batch.

    Ownership is enforced through the DATASET_BATCHES join.
    """

    _validate_owner(owner_user_id)

    if batch_id is not None:
        if not isinstance(batch_id, str) or not batch_id.strip():
            raise ValueError("A valid batch_id is required.")

    filters = []
    params = []

    if owner_user_id is not None:
        filters.append("b.OWNER_USER_ID = %s")
        params.append(owner_user_id)

    if batch_id is not None:
        filters.append("a.BATCH_ID = %s")
        params.append(batch_id.strip())

    where_clause = (
        "WHERE " + " AND ".join(filters)
        if filters
        else ""
    )

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            cursor.execute(
                f"""
                SELECT
                    a.ANOMALY_ID,
                    a.BATCH_ID,
                    a.RECORD_ID,
                    a.FARM_ID,
                    a.PLOT_ID,
                    a.CROP,
                    a.SEASON,
                    a.SOIL_TYPE,
                    a.ANOMALY_TYPE,
                    a.METRIC_NAME,
                    a.OBSERVED_VALUE,
                    a.EXPECTED_VALUE,
                    a.DEVIATION_PERCENTAGE,
                    a.SEVERITY,
                    a.EXPLANATION,
                    a.DETECTED_AT,
                    b.SOURCE_FILE_NAME
                FROM CAP16_ANALYTICS.AGRICULTURE.ANOMALY_RESULTS a
                INNER JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                    ON a.BATCH_ID = b.BATCH_ID
                {where_clause}
                ORDER BY a.DETECTED_AT DESC, a.PLOT_ID
                """,
                tuple(params),
            )

            return _fetch_all(cursor)

        finally:
            cursor.close()

    finally:
        connection.close()

def get_comparable_plot_analysis(
    batch_id: str,
    owner_user_id: int | None = None,
) -> list[dict]:
    """
    Return target records and their independent comparable plots.

    Peers are restricted to the same owner, crop, variety, season and soil
    type. Repeated uploads are collapsed to one average observation per
    owner/farm/plot/context, matching the detector's peer construction.
    Medians are calculated across those independent plot observations.
    """

    _validate_owner(owner_user_id)

    if not isinstance(batch_id, str) or not batch_id.strip():
        raise ValueError("A valid batch_id is required.")

    owner_filter = ""
    params: list = [batch_id.strip()]

    if owner_user_id is not None:
        owner_filter = "AND b.OWNER_USER_ID = %s"
        params.append(owner_user_id)

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()

        try:
            cursor.execute(
                f"""
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
                    SELECT
                        r.*,
                        b.OWNER_USER_ID
                    FROM CAP16_ANALYTICS.AGRICULTURE.AGRICULTURAL_RECORDS r
                    INNER JOIN CAP16_ANALYTICS.AGRICULTURE.DATASET_BATCHES b
                        ON r.BATCH_ID = b.BATCH_ID
                    WHERE r.QUALITY_STATUS = 'VALID'
                      AND r.BATCH_ID = %s
                      {owner_filter}
                ),
                peer_plot_metrics AS (
                    SELECT
                        OWNER_USER_ID,
                        FARM_ID,
                        PLOT_ID,
                        CROP,
                        CROP_VARIETY,
                        SEASON,
                        SOIL_TYPE,
                        AVG(FERTILIZER_KG_PER_HECTARE) AS FERTILIZER_VALUE,
                        AVG(WATER_LITERS_PER_HECTARE) AS WATER_VALUE,
                        AVG(YIELD_TONNES_HA) AS YIELD_VALUE
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
                peer_rows AS (
                    SELECT
                        t.RECORD_ID AS TARGET_RECORD_ID,
                        p.FARM_ID AS PEER_FARM_ID,
                        p.PLOT_ID AS PEER_PLOT_ID,
                        p.FERTILIZER_VALUE AS PEER_FERTILIZER_VALUE,
                        p.WATER_VALUE AS PEER_WATER_VALUE,
                        p.YIELD_VALUE AS PEER_YIELD_VALUE
                    FROM target_records t
                    LEFT JOIN peer_plot_metrics p
                        ON p.OWNER_USER_ID = t.OWNER_USER_ID
                       AND NOT (
                            EQUAL_NULL(p.FARM_ID, t.FARM_ID)
                            AND EQUAL_NULL(p.PLOT_ID, t.PLOT_ID)
                       )
                       AND p.CROP = t.CROP
                       AND EQUAL_NULL(p.CROP_VARIETY, t.CROP_VARIETY)
                       AND p.SEASON = t.SEASON
                       AND p.SOIL_TYPE = t.SOIL_TYPE
                ),
                peer_summary AS (
                    SELECT
                        TARGET_RECORD_ID,
                        COUNT(PEER_PLOT_ID) AS PEER_PLOT_COUNT,
                        COUNT(PEER_FERTILIZER_VALUE) AS FERTILIZER_PEER_COUNT,
                        COUNT(PEER_WATER_VALUE) AS WATER_PEER_COUNT,
                        COUNT(PEER_YIELD_VALUE) AS YIELD_PEER_COUNT,
                        MEDIAN(PEER_FERTILIZER_VALUE) AS MEDIAN_FERTILIZER,
                        MEDIAN(PEER_WATER_VALUE) AS MEDIAN_WATER,
                        MEDIAN(PEER_YIELD_VALUE) AS MEDIAN_YIELD
                    FROM peer_rows
                    GROUP BY TARGET_RECORD_ID
                )
                SELECT
                    t.BATCH_ID,
                    t.RECORD_ID,
                    t.FARM_ID,
                    t.PLOT_ID,
                    t.CROP,
                    t.CROP_VARIETY,
                    t.SEASON,
                    t.SOIL_TYPE,
                    t.FERTILIZER_KG_PER_HECTARE AS TARGET_FERTILIZER_VALUE,
                    t.WATER_LITERS_PER_HECTARE AS TARGET_WATER_VALUE,
                    t.YIELD_TONNES_HA AS TARGET_YIELD_VALUE,
                    COALESCE(s.PEER_PLOT_COUNT, 0) AS PEER_PLOT_COUNT,
                    COALESCE(s.FERTILIZER_PEER_COUNT, 0) AS FERTILIZER_PEER_COUNT,
                    COALESCE(s.WATER_PEER_COUNT, 0) AS WATER_PEER_COUNT,
                    COALESCE(s.YIELD_PEER_COUNT, 0) AS YIELD_PEER_COUNT,
                    s.MEDIAN_FERTILIZER,
                    s.MEDIAN_WATER,
                    s.MEDIAN_YIELD,
                    p.PEER_FARM_ID,
                    p.PEER_PLOT_ID,
                    p.PEER_FERTILIZER_VALUE,
                    p.PEER_WATER_VALUE,
                    p.PEER_YIELD_VALUE
                FROM target_records t
                LEFT JOIN peer_summary s
                    ON s.TARGET_RECORD_ID = t.RECORD_ID
                LEFT JOIN peer_rows p
                    ON p.TARGET_RECORD_ID = t.RECORD_ID
                ORDER BY t.CROP, t.FARM_ID, t.PLOT_ID, t.RECORD_ID,
                         p.PEER_FARM_ID, p.PEER_PLOT_ID
                """,
                tuple(params),
            )

            return _fetch_all(cursor)

        finally:
            cursor.close()

    finally:
        connection.close()

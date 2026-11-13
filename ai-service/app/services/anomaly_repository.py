
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

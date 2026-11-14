"""Snowflake connection utility for CAP-16."""

import logging
import os
from pathlib import Path

import snowflake.connector
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load ai-service/.env
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_FILE)


def get_snowflake_connection():
    """Create a connection to the CAP-16 Snowflake warehouse."""

    required = [
        "SNOWFLAKE_ACCOUNT",
        "SNOWFLAKE_USER",
        "SNOWFLAKE_PASSWORD",
    ]

    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise RuntimeError(
            f"Missing Snowflake configuration: {', '.join(missing)}"
        )

    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        role=os.getenv("SNOWFLAKE_ROLE", "CAP16_APP_ROLE"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE", "CAP16_WH"),
        database=os.getenv("SNOWFLAKE_DATABASE", "CAP16_ANALYTICS"),
        schema=os.getenv("SNOWFLAKE_SCHEMA", "AGRICULTURE"),
    )


def test_snowflake_connection():
    """Verify connectivity and return the active Snowflake identity."""

    connection = get_snowflake_connection()

    try:
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                SELECT
                    CURRENT_USER(),
                    CURRENT_ROLE(),
                    CURRENT_WAREHOUSE(),
                    CURRENT_DATABASE(),
                    CURRENT_SCHEMA()
                """
            )
            return cursor.fetchone()
        finally:
            cursor.close()
    finally:
        connection.close()

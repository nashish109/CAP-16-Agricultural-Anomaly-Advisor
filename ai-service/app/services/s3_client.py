
"""AWS S3 storage utility for CAP-16."""

import json
import logging
import os
from pathlib import Path
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load configuration from ai-service/.env
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_FILE)


def get_s3_client():
    """Create an S3 client using the configured AWS profile."""

    profile = os.getenv("AWS_PROFILE")
    region = os.getenv("AWS_REGION", "ap-south-1")

    if profile:
        session = boto3.Session(
            profile_name=profile,
            region_name=region,
        )
    else:
        session = boto3.Session(region_name=region)

    return session.client("s3")


def _upload_object(
    content: bytes,
    object_key: str,
    content_type: str,
) -> str:
    """Upload an object to the configured S3 bucket."""

    bucket = os.getenv("S3_BUCKET")

    if not bucket:
        raise RuntimeError("Missing S3_BUCKET configuration.")

    try:
        get_s3_client().put_object(
            Bucket=bucket,
            Key=object_key,
            Body=content,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )

        logger.info("Successfully uploaded object to S3: %s", object_key)

        return object_key

    except ClientError:
        logger.exception("Failed to upload object to S3: %s", object_key)
        raise


def upload_csv_to_s3(file_content: bytes, filename: str) -> str:
    """Upload the original CSV file to S3."""

    if not filename or not filename.lower().endswith(".csv"):
        raise ValueError("Only CSV files can be uploaded.")

    safe_filename = Path(filename).name

    object_key = (
        f"agricultural-uploads/raw/"
        f"{uuid4().hex}_{safe_filename}"
    )

    return _upload_object(
        content=file_content,
        object_key=object_key,
        content_type="text/csv",
    )


def upload_processed_data_to_s3(
    records: list[dict],
    batch_id: str,
) -> str:
    """Upload normalized agricultural records as JSON."""

    if not batch_id:
        raise ValueError("A valid batch ID is required.")

    content = json.dumps(
        records,
        indent=2,
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")

    object_key = (
        f"agricultural-uploads/processed/"
        f"{batch_id}_processed.json"
    )

    return _upload_object(
        content=content,
        object_key=object_key,
        content_type="application/json",
    )


def upload_rejected_records_to_s3(
    records: list[dict],
    batch_id: str,
) -> str | None:
    """Upload rejected agricultural records and validation errors."""

    if not records:
        logger.info(
            "No rejected records for batch %s. Skipping rejected-data upload.",
            batch_id,
        )
        return None

    if not batch_id:
        raise ValueError("A valid batch ID is required.")

    content = json.dumps(
        records,
        indent=2,
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")

    object_key = (
        f"agricultural-uploads/rejected/"
        f"{batch_id}_rejected.json"
    )

    return _upload_object(
        content=content,
        object_key=object_key,
        content_type="application/json",
    )

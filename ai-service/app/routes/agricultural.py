
"""Agricultural data-processing API routes for CAP-16."""

import json
import logging
from io import StringIO
from uuid import uuid4

import pandas as pd
from botocore.exceptions import ClientError
from fastapi import (
    APIRouter,
    Depends,
    File,
    Header,
    HTTPException,
    UploadFile,
)

from app.models.schemas import (
    CropRecord,
    DatasetProcessRequest,
    DatasetProcessResponse,
)
from app.security.internal_auth import verify_internal_service
from app.services.agricultural_processor import (
    process_agricultural_dataset,
)
from app.services.s3_client import (
    upload_csv_to_s3,
    upload_processed_data_to_s3,
    upload_rejected_records_to_s3,
)
from app.services.snowflake_repository import save_processed_dataset
from app.services.anomaly_detector import detect_anomalies


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/agricultural",
    tags=["Agricultural Processing"],
    dependencies=[Depends(verify_internal_service)],
)


@router.post(
    "/process",
    response_model=DatasetProcessResponse,
)
async def process_dataset(
    request: DatasetProcessRequest,
) -> DatasetProcessResponse:
    """Validate and process agricultural JSON records."""

    try:
        return process_agricultural_dataset(request)

    except Exception as exc:
        logger.exception("Agricultural dataset processing failed.")

        raise HTTPException(
            status_code=500,
            detail="Agricultural dataset processing failed.",
        ) from exc


@router.post(
    "/upload-csv",
    response_model=DatasetProcessResponse,
)
async def upload_agricultural_csv(
    file: UploadFile = File(...),
    owner_user_id: int = Header(
        ...,
        alias="X-Owner-User-Id",
        gt=0,
    ),
) -> DatasetProcessResponse:
    """
    Upload, validate and process agricultural CSV data.

    The owner ID is supplied by the authenticated Spring Boot
    backend through an internal request header.
    """

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded CSV file is empty.",
            )

        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="CSV file exceeds the 10 MB limit.",
            )

        # Step 1: Read the original CSV.
        dataframe = pd.read_csv(
            StringIO(contents.decode("utf-8-sig"))
        )

        if dataframe.empty:
            raise HTTPException(
                status_code=400,
                detail="The CSV contains no agricultural records.",
            )

        # Step 2: Validate only genuinely required CSV columns.
        # Optional fields use their Pydantic defaults when omitted.
        required_columns = {
            field_name
            for field_name, field_info in CropRecord.model_fields.items()
            if field_info.is_required()
        }

        missing_columns = required_columns - set(dataframe.columns)

        if missing_columns:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "CSV is missing required columns.",
                    "missing_columns": sorted(missing_columns),
                },
            )

        # Step 3: Store the original CSV in S3.
        try:
            raw_s3_key = upload_csv_to_s3(
                file_content=contents,
                filename=file.filename,
            )

        except (ClientError, RuntimeError, ValueError) as exc:
            logger.exception("Failed to store original CSV in S3.")

            raise HTTPException(
                status_code=503,
                detail="Could not store the original CSV in S3.",
            ) from exc

        # Step 4: Validate individual rows.
        valid_records = []
        rejected_records = []

        for index, row in dataframe.iterrows():

            raw_record = json.loads(
                pd.DataFrame([row.to_dict()]).to_json(
                    orient="records",
                    date_format="iso",
                )
            )[0]

            try:
                # Convert Pandas missing values to Python None.
                # This avoids passing NaN into Pydantic validation.
                record_data = {
                    key: None if pd.isna(value) else value
                    for key, value in row.to_dict().items()
                }

                record = CropRecord.model_validate(record_data)

                valid_records.append(record)

            except Exception as exc:
                rejected_records.append(
                    {
                        "row_number": int(index) + 2,
                        "record": raw_record,
                        "rejection_reason": str(exc),
                    }
                )

        # Step 5: Handle datasets containing no valid records.
        if not valid_records:

            rejected_batch_id = uuid4().hex

            try:
                rejected_s3_key = upload_rejected_records_to_s3(
                    records=rejected_records,
                    batch_id=rejected_batch_id,
                )

            except (ClientError, RuntimeError, ValueError) as exc:
                logger.exception(
                    "Failed to store rejected agricultural records."
                )

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Original CSV was stored in S3, but "
                        "rejected records could not be stored."
                    ),
                ) from exc

            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "No valid agricultural records were found. "
                        "All rejected records have been stored in S3."
                    ),
                    "raw_s3_key": raw_s3_key,
                    "rejected_s3_key": rejected_s3_key,
                    "rejected_records": len(rejected_records),
                },
            )

        # Step 6: Process valid agricultural records.
        request = DatasetProcessRequest(
            records=valid_records
        )

        result = process_agricultural_dataset(request)

        # Step 7: Persist records and uploader ownership in Snowflake.
        try:
            batch_id = save_processed_dataset(
                result=result,
                source_file_name=file.filename,
                owner_user_id=owner_user_id,
            )

        except Exception as exc:
            logger.exception(
                "Failed to persist agricultural data in Snowflake."
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Agricultural data was processed and the original "
                    "CSV was stored in S3, but saving to Snowflake failed."
                ),
            ) from exc

        # Step 8: Store normalized processed records in S3.
        processed_records = [
            record.model_dump(mode="json")
            for record in result.processed_records
        ]

        try:
            processed_s3_key = upload_processed_data_to_s3(
                records=processed_records,
                batch_id=batch_id,
            )

        except (ClientError, RuntimeError, ValueError) as exc:
            logger.exception(
                "Failed to store processed records in S3."
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Records were saved in Snowflake, but processed "
                    "data could not be stored in S3."
                ),
            ) from exc

        # Step 9: Store rejected records and validation errors in S3.
        try:
            rejected_s3_key = upload_rejected_records_to_s3(
                records=rejected_records,
                batch_id=batch_id,
            )

        except (ClientError, RuntimeError, ValueError) as exc:
            logger.exception(
                "Failed to store rejected records in S3."
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Processed data was saved, but rejected "
                    "records could not be stored in S3."
                ),
            ) from exc

        # Step 10: Automatically detect anomalies.
        try:
            anomaly_count = detect_anomalies(
                batch_id,
                owner_user_id,
            )
            anomaly_status = "SUCCESS"

        except Exception:
            logger.exception(
                "Anomaly detection failed for batch %s.",
                batch_id,
            )

            anomaly_count = 0
            anomaly_status = "FAILED"

        # Step 11: Include integration details in the API response.
        result.message = (
            f"{result.message} "
            f"Original CSV stored in S3: {raw_s3_key}. "
            f"Processed records stored in S3: {processed_s3_key}. "
            f"Rejected records: {len(rejected_records)}. "
            f"Rejected records S3 key: "
            f"{rejected_s3_key or 'No rejected records'}. "
            f"Snowflake batch ID: {batch_id}. "
            f"Anomaly detection status: {anomaly_status}. "
            f"Anomalies detected: {anomaly_count}."
        )

        logger.info(
            "Agricultural CSV processing completed. "
            "Owner ID: %s | Raw S3 key: %s | "
            "Processed S3 key: %s | Rejected records: %s | "
            "Batch ID: %s | Anomalies: %s | Detection status: %s",
            owner_user_id,
            raw_s3_key,
            processed_s3_key,
            len(rejected_records),
            batch_id,
            anomaly_count,
            anomaly_status,
        )

        return result

    except HTTPException:
        raise

    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV must use UTF-8 encoding.",
        ) from exc

    except pd.errors.EmptyDataError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV file contains no readable data.",
        ) from exc

    except pd.errors.ParserError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV format could not be parsed.",
        ) from exc

    except Exception as exc:
        logger.exception("Agricultural CSV processing failed.")

        raise HTTPException(
            status_code=500,
            detail="Agricultural CSV processing failed.",
        ) from exc

    finally:
        await file.close()

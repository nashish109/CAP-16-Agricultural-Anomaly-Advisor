
"""Agricultural data-processing API routes for CAP-16."""

from io import StringIO

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models.schemas import (
    CropRecord,
    DatasetProcessRequest,
    DatasetProcessResponse,
)
from app.services.agricultural_processor import (
    process_agricultural_dataset,
)

router = APIRouter(
    prefix="/api/agricultural",
    tags=["Agricultural Processing"],
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
) -> DatasetProcessResponse:
    """Upload, validate and process an agricultural CSV dataset."""

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

        dataframe = pd.read_csv(StringIO(contents.decode("utf-8-sig")))

        if dataframe.empty:
            raise HTTPException(
                status_code=400,
                detail="The CSV contains no agricultural records.",
            )

        required_columns = set(CropRecord.model_fields.keys())
        missing_columns = required_columns - set(dataframe.columns)

        if missing_columns:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "CSV is missing required columns.",
                    "missing_columns": sorted(missing_columns),
                },
            )

        records = []

        for index, row in dataframe.iterrows():
            try:
                record = CropRecord.model_validate(
                    row.where(pd.notna(row), None).to_dict()
                )
                records.append(record)

            except Exception as exc:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "row": int(index) + 2,
                        "message": "Invalid agricultural record.",
                        "error": str(exc),
                    },
                ) from exc

        request = DatasetProcessRequest(records=records)

        return process_agricultural_dataset(request)

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
        raise HTTPException(
            status_code=500,
            detail="Agricultural CSV processing failed.",
        ) from exc

    finally:
        await file.close()

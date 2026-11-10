"""Prediction API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.models.schemas import PredictionResponse
from app.services.predictor import get_predictor

logger = logging.getLogger(__name__)

router = APIRouter(tags=["predict"])

_MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB


def _validate_image_content_type(content_type: str | None) -> None:
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Content-Type must be image/* (e.g. image/jpeg, image/png)",
        )


async def _read_image_upload(file: UploadFile) -> bytes:
    _validate_image_content_type(file.content_type)
    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )
    if len(data) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum size of {_MAX_UPLOAD_BYTES} bytes",
        )
    return data


def _run_prediction(image_bytes: bytes) -> PredictionResponse:
    predictor = get_predictor()
    try:
        return predictor.predict(image_bytes)
    except ValueError as exc:
        logger.warning("Prediction rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected prediction failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed",
        ) from exc


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict plant disease from an uploaded image",
)
async def predict_image(
    file: UploadFile = File(..., description="Leaf/plant image (image/*)"),
) -> PredictionResponse:
    """
    Accept a multipart image upload and return a structured disease prediction.

    Validates that the Content-Type is `image/*`.
    """
    logger.info(
        "POST /predict filename=%s content_type=%s",
        file.filename,
        file.content_type,
    )
    image_bytes = await _read_image_upload(file)
    return _run_prediction(image_bytes)


@router.post(
    "/predict/json",
    response_model=PredictionResponse,
    summary="Predict plant disease (JSON response wrapper)",
)
async def predict_image_json(
    file: UploadFile = File(..., description="Leaf/plant image (image/*)"),
) -> JSONResponse:
    """
    Alternative endpoint with the same upload contract as `/predict`.

    Returns an explicit JSONResponse body for clients that prefer this path.
    """
    logger.info(
        "POST /predict/json filename=%s content_type=%s",
        file.filename,
        file.content_type,
    )
    image_bytes = await _read_image_upload(file)
    result = _run_prediction(image_bytes)
    return JSONResponse(content=result.model_dump())

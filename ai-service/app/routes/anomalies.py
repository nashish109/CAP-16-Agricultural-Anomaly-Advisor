
"""Protected anomaly assessment API for CAP-16."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.security.internal_auth import verify_internal_service
from app.services.anomaly_repository import (
    get_anomaly_assessments,
    get_anomaly_batches,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/anomalies",
    tags=["Anomaly Assessments"],
    dependencies=[Depends(verify_internal_service)],
)


def _resolve_owner(
    user_role: str,
    owner_user_id: int | None,
) -> tuple[str, int | None]:
    role = user_role.strip().upper()

    if role == "FARMER":
        if owner_user_id is None:
            raise HTTPException(
                status_code=400,
                detail="Farmer user ID is required.",
            )
        return role, owner_user_id

    if role in {"ANALYST", "ADMIN"}:
        return role, None

    raise HTTPException(
        status_code=403,
        detail="Your role is not authorized to access anomaly assessments.",
    )


@router.get("/batches")
async def list_anomaly_batches(
    owner_user_id: int | None = Header(
        default=None,
        alias="X-Owner-User-Id",
        gt=0,
    ),
    user_role: str = Header(..., alias="X-User-Role"),
) -> dict:
    role, query_owner_id = _resolve_owner(user_role, owner_user_id)

    try:
        batches = get_anomaly_batches(query_owner_id)

        return {
            "success": True,
            "role": role,
            "data": batches,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Anomaly batch retrieval failed.")
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve agricultural dataset batches.",
        ) from exc


@router.get("/assessments")
async def list_anomaly_assessments(
    batch_id: str | None = Query(default=None, min_length=1),
    owner_user_id: int | None = Header(
        default=None,
        alias="X-Owner-User-Id",
        gt=0,
    ),
    user_role: str = Header(..., alias="X-User-Role"),
) -> dict:
    role, query_owner_id = _resolve_owner(user_role, owner_user_id)

    try:
        assessments = get_anomaly_assessments(
            owner_user_id=query_owner_id,
            batch_id=batch_id,
        )

        return {
            "success": True,
            "role": role,
            "batch_id": batch_id,
            "total_assessments": len(assessments),
            "data": assessments,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Anomaly assessment retrieval failed.")
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve agricultural anomaly assessments.",
        ) from exc

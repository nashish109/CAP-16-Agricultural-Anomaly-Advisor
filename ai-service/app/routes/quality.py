
"""Protected data-quality reporting API for CAP-16."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.models.schemas import CropRecord
from app.security.internal_auth import verify_internal_service
from app.services.quality_repository import get_quality_report

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/agricultural",
    tags=["Agricultural Data Quality"],
    dependencies=[Depends(verify_internal_service)],
)


@router.get("/quality")
async def get_agricultural_quality(
    batch_id: str | None = Query(default=None),
    owner_user_id: int | None = Header(
        default=None,
        alias="X-Owner-User-Id",
        gt=0,
    ),
    user_role: str = Header(..., alias="X-User-Role"),
) -> dict:
    """Retrieve persisted agricultural data-quality information."""

    role = user_role.strip().upper()

    if role == "FARMER":
        if owner_user_id is None:
            raise HTTPException(
                status_code=400,
                detail="Farmer user ID is required.",
            )

        query_owner_id = owner_user_id

    elif role in {"ANALYST", "ADMIN"}:
        query_owner_id = None

    else:
        raise HTTPException(
            status_code=403,
            detail="Your role is not authorized to access data quality reports.",
        )

    try:
        report = get_quality_report(
            owner_user_id=query_owner_id,
            batch_id=batch_id,
        )

        schema = [
            {
                "name": field_name,
                "required": field_info.is_required(),
            }
            for field_name, field_info in CropRecord.model_fields.items()
        ]

        report["schema"] = schema

        return {
            "success": True,
            "role": role,
            "data": report,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Agricultural quality report retrieval failed.")

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve agricultural data-quality information.",
        ) from exc

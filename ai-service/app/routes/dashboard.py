
"""Protected dashboard analytics API for CAP-16."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException

from app.security.internal_auth import verify_internal_service
from app.services.dashboard_repository import get_dashboard_analytics

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard Analytics"],
    dependencies=[Depends(verify_internal_service)],
)


@router.get("/analytics")
async def get_analytics(
    owner_user_id: int | None = Header(
        default=None,
        alias="X-Owner-User-Id",
        gt=0,
    ),
    user_role: str = Header(..., alias="X-User-Role"),
) -> dict:
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
            detail="Your role is not authorized to access dashboard analytics.",
        )

    try:
        analytics = get_dashboard_analytics(query_owner_id)

        return {
            "success": True,
            "role": role,
            "data": analytics,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Dashboard analytics retrieval failed.")
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve agricultural dashboard analytics.",
        ) from exc


import os
import secrets

from fastapi import Header, HTTPException, status


async def verify_internal_service(
    x_internal_service_token: str | None = Header(
        default=None,
        alias="X-Internal-Service-Token",
    ),
) -> None:
    """
    Verify that requests originate from the trusted Spring Boot backend.
    """

    expected_token = os.getenv("INTERNAL_SERVICE_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal service authentication is not configured.",
        )

    if (
        not x_internal_service_token
        or not secrets.compare_digest(
            x_internal_service_token,
            expected_token,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service credentials.",
        )


"""CAP-16 Agricultural Data Processing Service."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.agricultural import router as agricultural_router
from app.routes.anomalies import router as anomalies_router
from app.routes.dashboard import router as dashboard_router
from app.routes.quality import router as quality_router

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("cap16.ai")

app = FastAPI(
    title="CAP-16 Agricultural Data Processing Service",
    description=(
        "Processes agricultural crop input and yield records "
        "for data quality checks, independent-plot yield anomaly "
        "analysis, anomaly assessments and dashboard analytics."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(agricultural_router)
app.include_router(dashboard_router)
app.include_router(quality_router)
app.include_router(anomalies_router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Service liveness endpoint."""
    return {
        "status": "ok",
        "service": "CAP-16 Agricultural Data Processing Service",
    }

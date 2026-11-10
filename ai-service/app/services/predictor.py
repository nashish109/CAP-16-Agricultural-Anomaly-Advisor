"""
Disease prediction abstractions and model loader.

Architecture notes
------------------
* PredictorProtocol — structural interface (and ABC) for any predictor.
* MockPredictor — default demo path; always available (no weights needed).
* TorchModelPredictor — stub that attempts to load a PyTorch .pt/.pth file
  from MODEL_PATH when the file exists. **No trained model is bundled**
  with this service. Until you place your own weights at MODEL_PATH and
  implement the forward/post-process logic, TorchModelPredictor falls
  back to MockPredictor for every request.

To plug in a real model later:
1. Export or train a classification checkpoint and set MODEL_PATH.
2. Implement TorchModelPredictor._run_inference with your preprocessing
   and class-index → PredictionResponse mapping.
3. Keep get_predictor() as the single factory used by API routes.
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Protocol, runtime_checkable

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.models.schemas import PredictionResponse
from app.services.mock_predictor import MockPredictor

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Environment-driven settings for the AI service."""

    model_path: str = ""
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@runtime_checkable
class PredictorProtocol(Protocol):
    """Structural protocol for disease predictors."""

    def predict(self, image_bytes: bytes) -> PredictionResponse:
        """Run disease detection on raw image bytes."""
        ...


class BasePredictor(ABC):
    """Abstract base class mirroring PredictorProtocol for inheritance."""

    @abstractmethod
    def predict(self, image_bytes: bytes) -> PredictionResponse:
        """Run disease detection on raw image bytes."""


class TorchModelPredictor(BasePredictor):
    """
    Stub PyTorch predictor.

    IMPORTANT: This repository does **not** ship a trained `.pt` model.
    If MODEL_PATH is unset or the file is missing, or if `torch` is not
    installed, every prediction is delegated to MockPredictor.

    When a checkpoint is present, `_load_model` attempts a `torch.load`
    for future use, but inference still uses the mock path until you
    implement `_run_inference`.
    """

    def __init__(self, model_path: str | Path | None = None) -> None:
        self._model_path = Path(model_path) if model_path else None
        self._model = None
        self._fallback = MockPredictor()
        self._torch_ready = False

        if self._model_path and self._model_path.is_file():
            self._torch_ready = self._load_model(self._model_path)
        else:
            if self._model_path:
                logger.warning(
                    "MODEL_PATH set to %s but file not found; using MockPredictor",
                    self._model_path,
                )
            else:
                logger.info(
                    "No MODEL_PATH configured. No trained model is bundled; "
                    "using MockPredictor for all requests."
                )

    def _load_model(self, path: Path) -> bool:
        """
        Attempt to load a PyTorch checkpoint.

        Returns True if torch.load succeeds. Does not perform inference;
        that remains a stub until a real architecture is wired in.
        """
        try:
            import torch  # type: ignore[import-untyped]
        except ImportError:
            logger.warning(
                "PyTorch is not installed. Cannot load %s; using MockPredictor. "
                "Install torch and implement _run_inference when ready.",
                path,
            )
            return False

        try:
            # map_location='cpu' keeps loading portable for CPU-only hosts
            self._model = torch.load(path, map_location="cpu", weights_only=False)
            logger.info(
                "Loaded checkpoint from %s. Inference is still stubbed — "
                "implement TorchModelPredictor._run_inference to use real weights. "
                "Falling back to MockPredictor until then.",
                path,
            )
            return True
        except Exception:
            logger.exception(
                "Failed to load model from %s; using MockPredictor",
                path,
            )
            self._model = None
            return False

    def _run_inference(self, image_bytes: bytes) -> PredictionResponse | None:
        """
        Placeholder for real PyTorch inference.

        Return a PredictionResponse when implemented, or None to signal
        that the caller should use the mock fallback.
        """
        # Future: preprocess with OpenCV/PIL → tensor → self._model → labels
        _ = image_bytes
        _ = self._model
        return None

    def predict(self, image_bytes: bytes) -> PredictionResponse:
        if self._torch_ready and self._model is not None:
            result = self._run_inference(image_bytes)
            if result is not None:
                return result
            logger.debug(
                "Torch inference stub returned None; delegating to MockPredictor"
            )
        return self._fallback.predict(image_bytes)


_predictor: PredictorProtocol | None = None


def get_predictor() -> PredictorProtocol:
    """
    Return a process-wide predictor singleton.

    Prefers TorchModelPredictor when MODEL_PATH points to an existing file;
    otherwise (and by design until a real model is provided) behaves as mock.
    """
    global _predictor
    if _predictor is None:
        settings = Settings()
        model_path = settings.model_path or os.getenv("MODEL_PATH", "")
        path = Path(model_path) if model_path else None

        if path and path.is_file():
            logger.info("Initializing TorchModelPredictor with MODEL_PATH=%s", path)
            _predictor = TorchModelPredictor(path)
        else:
            logger.info(
                "Initializing MockPredictor "
                "(no trained model bundled; set MODEL_PATH to use a .pt file later)"
            )
            _predictor = TorchModelPredictor(path)  # still wraps mock fallback
    return _predictor


def reset_predictor() -> None:
    """Clear the singleton (useful for tests)."""
    global _predictor
    _predictor = None

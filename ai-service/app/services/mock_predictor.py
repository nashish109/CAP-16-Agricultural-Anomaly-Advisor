"""
Mock disease predictor for development and demos.

No trained neural network is bundled. This module inspects basic image
statistics (mean RGB via PIL/NumPy) and maps them to a small curated set
of demo crop/disease profiles with realistic confidence scores.
"""

from __future__ import annotations

import hashlib
import logging
from io import BytesIO

import numpy as np
from PIL import Image

from app.models.schemas import PredictionResponse

logger = logging.getLogger(__name__)

# Curated demo profiles: (crop, disease, description, treatment, prevention, recommendations)
_DISEASE_PROFILES: list[dict] = [
    {
        "crop": "Tomato",
        "disease": "Early Blight",
        "description": (
            "Early blight is a fungal disease caused by Alternaria solani. "
            "It typically appears as dark brown lesions with concentric rings "
            "(target-spot pattern) on older, lower leaves, often surrounded by "
            "a yellow halo. Severe infection can defoliate plants and reduce yield."
        ),
        "treatment": [
            "Remove and destroy infected lower leaves promptly",
            "Apply a labeled copper-based or chlorothalonil fungicide at first symptoms",
            "Improve airflow by pruning suckers and staking plants",
            "Avoid working plants when foliage is wet",
        ],
        "prevention": [
            "Rotate solanaceous crops every 2–3 years",
            "Mulch soil to reduce splash of spores onto leaves",
            "Water at the base; avoid overhead irrigation",
            "Use certified disease-free transplants and resistant cultivars when available",
        ],
        "recommendations": [
            "Inspect the lower canopy weekly during warm, humid weather",
            "Space plants to allow good air circulation",
            "Sanitize stakes and tools between plantings",
        ],
    },
    {
        "crop": "Tomato",
        "disease": "Late Blight",
        "description": (
            "Late blight (Phytophthora infestans) produces water-soaked lesions "
            "that rapidly turn brown/black on leaves and stems, often with white "
            "fuzzy growth on undersides in humid conditions. It can destroy crops "
            "within days under cool, wet weather."
        ),
        "treatment": [
            "Remove heavily infected plants immediately to limit spread",
            "Apply systemic fungicides labeled for late blight at early detection",
            "Destroy debris; do not compost infected material",
        ],
        "prevention": [
            "Plant resistant varieties where available",
            "Avoid prolonged leaf wetness; irrigate early in the day",
            "Eliminate volunteer tomato/potato plants nearby",
        ],
        "recommendations": [
            "Monitor weather for cool nights and wet periods",
            "Scout fields after rain events",
        ],
    },
    {
        "crop": "Potato",
        "disease": "Early Blight",
        "description": (
            "Potato early blight causes brown, concentric lesions on leaflets, "
            "often starting on older foliage. Defoliation reduces tuber size and "
            "can predispose tubers to secondary infections in storage."
        ),
        "treatment": [
            "Apply protectant fungicides on a preventive schedule in high-risk weather",
            "Remove severely affected haulms before harvest if practical",
            "Cure tubers properly and store in cool, dry conditions",
        ],
        "prevention": [
            "Use certified seed potatoes",
            "Practice 2–3 year rotation away from potatoes and tomatoes",
            "Maintain balanced fertility; avoid late-season nitrogen excess",
        ],
        "recommendations": [
            "Hill soil to protect developing tubers",
            "Scout lower leaves starting mid-season",
        ],
    },
    {
        "crop": "Potato",
        "disease": "Late Blight",
        "description": (
            "Late blight on potato presents as dark, greasy foliar lesions and "
            "can infect tubers, causing brown dry rot that spreads in storage. "
            "It thrives in cool, moist environments."
        ),
        "treatment": [
            "Apply late-blight fungicides at the first confirmed lesions",
            "Destroy infected tops before harvest when risk is high",
            "Grade out soft or discolored tubers before storage",
        ],
        "prevention": [
            "Plant certified seed; destroy cull piles",
            "Ensure adequate hill coverage over tubers",
            "Avoid irrigation that keeps canopies wet overnight",
        ],
        "recommendations": [
            "Use blight forecasting tools for spray timing",
            "Isolate new seed lots when possible",
        ],
    },
    {
        "crop": "Corn",
        "disease": "Northern Corn Leaf Blight",
        "description": (
            "Northern corn leaf blight (Exserohilum turcicum) forms long, "
            "elliptical gray-green to tan lesions on leaves. Heavy infection "
            "reduces photosynthetic area and can cut grain yield significantly."
        ),
        "treatment": [
            "Apply foliar fungicides when lesions appear before tasseling in susceptible hybrids",
            "Follow label intervals if disease pressure remains high",
        ],
        "prevention": [
            "Select hybrids with partial resistance",
            "Rotate with non-host crops and manage residue",
            "Avoid continuous corn in high-pressure fields",
        ],
        "recommendations": [
            "Scout from mid-vegetative stages through grain fill",
            "Prioritize fungicide on high-yield fields when needed",
        ],
    },
    {
        "crop": "Corn",
        "disease": "Common Rust",
        "description": (
            "Common rust produces small, circular to elongate cinnamon-brown "
            "pustules on both leaf surfaces. Yield impact is usually low unless "
            "infection is early and severe on susceptible hybrids."
        ),
        "treatment": [
            "Fungicide sprays are rarely needed except on very susceptible hybrids "
            "with early, heavy infection",
        ],
        "prevention": [
            "Plant resistant or tolerant hybrids",
            "Maintain balanced plant nutrition for vigorous growth",
        ],
        "recommendations": [
            "Confirm pustule color and distribution to distinguish from southern rust",
            "Continue routine scouting through mid-season",
        ],
    },
    {
        "crop": "Chili",
        "disease": "Leaf Spot",
        "description": (
            "Bacterial or fungal leaf spot on chili/pepper appears as small "
            "water-soaked or dark lesions that may coalesce, causing yellowing "
            "and premature leaf drop. Fruit can develop spots that reduce marketability."
        ),
        "treatment": [
            "Remove heavily spotted leaves and destroy them",
            "Apply copper-based bactericides/fungicides per local recommendations",
            "Reduce overhead watering to keep foliage dry",
        ],
        "prevention": [
            "Use disease-free seed and transplants",
            "Avoid working wet plants; disinfect tools",
            "Rotate away from solanaceous crops when possible",
        ],
        "recommendations": [
            "Improve drainage and spacing for faster canopy drying",
            "Mulch to limit soil splash onto foliage",
        ],
    },
    {
        "crop": "Chili",
        "disease": "Powdery Mildew",
        "description": (
            "Powdery mildew on chili shows white to gray powdery patches on "
            "upper leaf surfaces, leading to yellowing, curling, and defoliation "
            "under warm, dry days with humid nights."
        ),
        "treatment": [
            "Apply sulfur or other labeled mildewicides at early onset",
            "Remove severely infected leaves to reduce inoculum",
        ],
        "prevention": [
            "Avoid dense plantings that trap humidity",
            "Ensure adequate potassium and avoid excess nitrogen",
        ],
        "recommendations": [
            "Scout undersides and upper canopy regularly",
            "Rotate fungicide modes of action if sprays are repeated",
        ],
    },
    {
        "crop": "Rice",
        "disease": "Brown Spot",
        "description": (
            "Brown spot (Bipolaris oryzae) causes oval brown lesions with a "
            "gray center on leaves and can infect grains (dirty panicles). "
            "It is favored by nutrient stress, especially silicon/potassium "
            "deficiency, and warm humid conditions."
        ),
        "treatment": [
            "Apply recommended foliar fungicides when severity exceeds local thresholds",
            "Correct nutrient imbalances, especially potassium and silicon",
        ],
        "prevention": [
            "Use certified seed treated as recommended",
            "Maintain balanced fertilization and good water management",
            "Manage crop residue and avoid continuous rice where pressure is high",
        ],
        "recommendations": [
            "Scout from tillering through grain filling",
            "Ensure even stand establishment to reduce plant stress",
        ],
    },
    {
        "crop": "Rice",
        "disease": "Blast",
        "description": (
            "Rice blast (Magnaporthe oryzae) produces diamond-shaped lesions "
            "with gray centers and brown margins on leaves; neck blast can "
            "cause blank panicles and severe yield loss."
        ),
        "treatment": [
            "Apply blast fungicides preventively in high-risk periods or at first lesions",
            "Avoid excessive nitrogen that softens tissue and increases susceptibility",
        ],
        "prevention": [
            "Plant resistant varieties suited to the region",
            "Maintain balanced water and fertility management",
            "Destroy or plow under infected stubble when practical",
        ],
        "recommendations": [
            "Watch for blast after cloudy, humid stretches",
            "Protect the neck stage in susceptible cultivars",
        ],
    },
    {
        "crop": "Paddy",
        "disease": "Bacterial Leaf Blight",
        "description": (
            "Bacterial leaf blight (Xanthomonas oryzae pv. oryzae) starts as "
            "water-soaked stripes from leaf tips or margins that turn yellow "
            "to white. In severe cases, leaves dry out and tillering/yield decline."
        ),
        "treatment": [
            "Remove and destroy severely infected hills in seedbeds",
            "Use copper or antibiotic products only where locally approved and labeled",
            "Drain and reflood fields carefully to manage humidity when advised",
        ],
        "prevention": [
            "Use resistant cultivars and clean seed",
            "Avoid excess nitrogen; balance with potassium",
            "Sanitize tools and reduce wounding during field operations",
        ],
        "recommendations": [
            "Scout nursery beds and field edges early",
            "Avoid dense planting that prolongs leaf wetness",
        ],
    },
    {
        "crop": "Tomato",
        "disease": "Healthy",
        "description": (
            "No significant disease symptoms detected in this demo analysis. "
            "Leaf coloration and uniformity are consistent with healthy foliage. "
            "Continue routine monitoring as conditions change."
        ),
        "treatment": [
            "No chemical treatment required at this time",
        ],
        "prevention": [
            "Maintain balanced irrigation and nutrition",
            "Continue weekly scouting for early signs of blight or spots",
        ],
        "recommendations": [
            "Keep records of weather and any nearby outbreaks",
            "Re-test if new lesions appear",
        ],
    },
]


def _mean_rgb(image_bytes: bytes) -> tuple[float, float, float]:
    """Load image bytes and return mean R, G, B in 0–255."""
    with Image.open(BytesIO(image_bytes)) as img:
        rgb = img.convert("RGB")
        arr = np.asarray(rgb, dtype=np.float32)
    means = arr.mean(axis=(0, 1))
    return float(means[0]), float(means[1]), float(means[2])


def _select_profile_index(r: float, g: float, b: float, image_bytes: bytes) -> int:
    """
    Map color stats to a profile index.

    Prefer Early Blight (Tomato) for green-dominant foliage (typical leaf images).
    Use brightness / channel balance for other demo diseases. Hash provides
    stable tie-breaking so the same image yields the same result.
    """
    n = len(_DISEASE_PROFILES)
    digest = hashlib.sha256(image_bytes[:4096]).hexdigest()
    tie_break = int(digest[:8], 16)

    brightness = (r + g + b) / 3.0
    green_dominance = g - max(r, b)
    red_ratio = r / (g + 1e-6)
    blue_ratio = b / (g + 1e-6)

    # Default-ish: healthy-looking green leaves → Tomato Early Blight (index 0)
    if green_dominance > 15 and 40 < brightness < 180:
        return 0  # Tomato Early Blight

    if brightness > 200 and green_dominance > 5:
        return n - 1  # Tomato Healthy

    if red_ratio > 1.15 and brightness < 120:
        return 1 if tie_break % 2 == 0 else 3  # Late blight variants

    if blue_ratio > 0.95 and brightness < 100:
        return 8 + (tie_break % 3)  # Rice / Paddy cluster (indices 8–10)

    if g > r and brightness >= 140:
        return 4 + (tie_break % 2)  # Corn

    if r > g * 0.9 and 80 < brightness < 160:
        return 6 + (tie_break % 2)  # Chili

    if brightness < 70:
        return 2  # Potato Early Blight (darker foliage)

    # Stable fallback across remaining profiles; bias toward Early Blight
    if tie_break % 5 == 0:
        return 0
    return tie_break % n


def _confidence_from_stats(r: float, g: float, b: float, image_bytes: bytes) -> float:
    """Produce a demo confidence in [0.75, 0.95] from image stats."""
    brightness = (r + g + b) / 3.0
    contrast_proxy = abs(g - r) + abs(g - b)
    digest = hashlib.md5(image_bytes[:2048]).hexdigest()
    jitter = (int(digest[:4], 16) % 1000) / 1000.0  # 0–0.999

    base = 0.75 + min(contrast_proxy / 200.0, 0.12)
    brightness_term = 0.05 * (1.0 - abs(brightness - 110.0) / 110.0)
    score = base + brightness_term + 0.03 * jitter
    return float(round(min(0.95, max(0.75, score)), 4))


class MockPredictor:
    """
    Demo predictor: no ML weights required.

    Analyzes mean color of the uploaded image and returns a full
    PredictionResponse from the curated disease catalog.
    """

    def predict(self, image_bytes: bytes) -> PredictionResponse:
        if not image_bytes:
            raise ValueError("Empty image payload")

        try:
            r, g, b = _mean_rgb(image_bytes)
        except Exception as exc:
            logger.exception("Failed to decode image for mock prediction")
            raise ValueError(f"Unable to read image: {exc}") from exc

        idx = _select_profile_index(r, g, b, image_bytes)
        profile = _DISEASE_PROFILES[idx]
        confidence = _confidence_from_stats(r, g, b, image_bytes)

        logger.info(
            "MockPredictor selected %s / %s (confidence=%.3f, mean_rgb=(%.1f,%.1f,%.1f))",
            profile["crop"],
            profile["disease"],
            confidence,
            r,
            g,
            b,
        )

        return PredictionResponse(
            crop=profile["crop"],
            disease=profile["disease"],
            confidence=confidence,
            description=profile["description"],
            treatment=list(profile["treatment"]),
            prevention=list(profile["prevention"]),
            recommendations=list(profile["recommendations"]),
        )

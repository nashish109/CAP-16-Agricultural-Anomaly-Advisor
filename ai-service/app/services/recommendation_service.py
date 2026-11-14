"""Contextual farming recommendations for CAP-16 anomaly assessments."""

from typing import Any


def _number(value: Any) -> float | None:
    try:
        if value is None:
            return None
        result = float(value)
        return result if result == result and abs(result) != float("inf") else None
    except (TypeError, ValueError):
        return None


def generate_recommendation(assessment: dict) -> dict:
    """Generate an advisory recommendation from a persisted assessment."""

    anomaly_type = str(assessment.get("anomaly_type", "")).upper()
    severity = str(assessment.get("severity", "INFO")).upper()
    crop = assessment.get("crop") or "the crop"
    plot_id = assessment.get("plot_id") or "Unknown"
    metric = assessment.get("metric_name") or "the measured metric"

    observed = _number(assessment.get("observed_value"))
    expected = _number(assessment.get("expected_value"))
    deviation = _number(assessment.get("deviation_percentage"))

    common = {
        "anomaly_id": assessment.get("anomaly_id"),
        "batch_id": assessment.get("batch_id"),
        "record_id": assessment.get("record_id"),
        "farm_id": assessment.get("farm_id"),
        "plot_id": plot_id,
        "crop": crop,
        "anomaly_type": anomaly_type,
        "metric_name": metric,
        "observed_value": observed,
        "expected_value": expected,
        "deviation_percentage": deviation,
        "priority": severity,
    }

    if anomaly_type == "INSUFFICIENT_DATA":
        return {
            **common,
            "title": "Collect more comparable plot data",
            "recommendation": (
                "No reliable peer benchmark is available for this assessment. "
                "Collect valid records from at least three independent plots "
                "with matching crop, variety, season and soil conditions "
                "before making a comparative farming decision."
            ),
            "suggested_actions": [
                "Verify that plot identifiers and crop details are correct.",
                "Collect comparable records from additional independent plots.",
                "Record the missing agricultural metric where applicable.",
                "Run the analysis again when sufficient data is available.",
            ],
            "rationale": assessment.get("explanation", ""),
            "advisory_note": (
                "Insufficient data is not evidence of poor farm performance."
            ),
        }

    if observed is None or expected is None or expected <= 0:
        return {
            **common,
            "title": "Review incomplete anomaly assessment",
            "recommendation": (
                "The assessment does not contain sufficient numeric values "
                "for a reliable recommendation. Verify the source record."
            ),
            "suggested_actions": [
                "Check the uploaded agricultural record.",
                "Verify the processed metric and peer benchmark.",
                "Repeat the assessment after correcting incomplete data.",
            ],
            "rationale": assessment.get("explanation", ""),
            "advisory_note": "No quantitative adjustment is recommended.",
        }

    if anomaly_type == "EXCESS_FERTILIZER":
        title = "Review fertilizer application"
        recommendation = (
            f"Plot {plot_id} has recorded fertilizer consumption of "
            f"{observed:.2f} kg/ha, compared with the comparable-plot "
            f"median of {expected:.2f} kg/ha. Review fertilizer type, "
            "application timing, soil nutrient status and crop growth stage "
            "before deciding whether application practices need adjustment."
        )
        actions = [
            "Review fertilizer application records and timing.",
            "Check soil nutrient status before the next application.",
            "Compare fertilizer type and application practices with peer plots.",
            "Consult local agronomic guidance before changing application rates.",
        ]

    elif anomaly_type == "EXCESS_WATER":
        title = "Review irrigation efficiency"
        recommendation = (
            f"Plot {plot_id} has recorded water consumption of "
            f"{observed:.2f} L/ha, compared with the comparable-plot "
            f"median of {expected:.2f} L/ha. Review irrigation scheduling, "
            "soil moisture, rainfall and water delivery efficiency."
        )
        actions = [
            "Inspect irrigation schedules and application records.",
            "Check soil moisture before irrigation.",
            "Account for recent rainfall and crop growth stage.",
            "Inspect the irrigation system for leaks or uneven distribution.",
        ]

    elif anomaly_type == "LOW_CROP_YIELD":
        title = "Investigate below-peer crop yield"
        recommendation = (
            f"Plot {plot_id} has recorded yield of {observed:.2f} tonnes/ha, "
            f"compared with the comparable-plot median of "
            f"{expected:.2f} tonnes/ha. Investigate crop health, pest and "
            "disease pressure, soil conditions, water availability and "
            "weather events before selecting corrective measures."
        )
        actions = [
            "Inspect crop health and identify possible pest or disease damage.",
            "Review sowing dates and crop growth conditions.",
            "Check soil fertility and water availability.",
            "Review weather conditions during the growing season.",
            "Compare cultivation practices with the eligible peer plots.",
        ]

    else:
        return {
            **common,
            "title": "Manual assessment required",
            "recommendation": (
                "This anomaly type does not have a configured advisory rule."
            ),
            "suggested_actions": [
                "Review the anomaly assessment and underlying record.",
                "Consult an agricultural specialist before taking action.",
            ],
            "rationale": assessment.get("explanation", ""),
            "advisory_note": "No automated farming adjustment is recommended.",
        }

    return {
        **common,
        "title": title,
        "recommendation": recommendation,
        "suggested_actions": actions,
        "rationale": assessment.get("explanation", ""),
        "advisory_note": (
            "This is a decision-support recommendation, not proof of causation. "
            "Validate local conditions before changing farming practices."
        ),
    }


def generate_recommendations(assessments: list[dict]) -> list[dict]:
    """Generate recommendations for a collection of anomaly assessments."""

    return [generate_recommendation(item) for item in assessments]

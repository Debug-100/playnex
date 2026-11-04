"""
PLAYNEX — Prediction Service
Loads trained model and generates sales predictions for new configurations.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "artifacts", "model.joblib")
OPTIONS_PATH = os.path.join(BASE_DIR, "..", "artifacts", "model_options.json")

_model = None
_options = None


def load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                "Model not found. Run: python ml/train.py"
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def load_options():
    global _options
    if _options is None:
        if not os.path.exists(OPTIONS_PATH):
            raise FileNotFoundError("model_options.json not found.")
        with open(OPTIONS_PATH) as f:
            _options = json.load(f)
    return _options


def validate_inputs(genre, platform, publisher, year):
    """Validate that all inputs are within the model's known categories."""
    opts = load_options()
    errors = []
    if genre not in opts["genres"]:
        errors.append(f"Unknown genre: '{genre}'")
    if platform not in opts["platforms"]:
        errors.append(f"Unknown platform: '{platform}'")
    if publisher not in opts["publishers"] and publisher != "Unknown":
        # Allow unknown — model handles it with unknown_value=-1
        pass
    year_min = min(opts["years"])
    year_max = max(opts["years"])
    if not (year_min <= year <= year_max):
        errors.append(f"Year {year} is outside training range [{year_min}, {year_max}]")
    return errors


def predict(genre: str, platform: str, publisher: str, year: int) -> dict:
    """Generate a sales prediction for a game configuration."""
    model = load_model()

    input_df = pd.DataFrame([{
        "Genre": genre,
        "Platform": platform,
        "Publisher": publisher,
        "Year": year,
    }])

    prediction = model.predict(input_df)[0]

    # Map predictions to target names
    # We trained on [NA_Sales, EU_Sales, JP_Sales, Other_Sales, Global_Sales]
    # or a subset — read from metrics.json
    metrics_path = os.path.join(BASE_DIR, "..", "artifacts", "metrics.json")
    targets = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales", "Global_Sales"]
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            m = json.load(f)
            targets = m.get("targets", targets)

    if isinstance(prediction, (float, int, np.floating)):
        prediction = [prediction]

    result = {}
    for i, t in enumerate(targets):
        val = float(prediction[i]) if i < len(prediction) else 0.0
        result[t] = max(0.0, round(val, 3))

    # Ensure global is at least sum of regions
    if "Global_Sales" in result and "NA_Sales" in result:
        regional_sum = sum(result.get(k, 0) for k in ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"])
        # Note discrepancy but don't override — model predicts independently
        result["_regional_sum"] = round(regional_sum, 3)
        result["_discrepancy_note"] = (
            "Global sales is modeled independently from regional predictions. "
            "Minor discrepancies between global and regional sum are expected."
        ) if abs(result["Global_Sales"] - regional_sum) > 0.1 else None

    return result


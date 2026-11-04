from flask import Blueprint, jsonify
import os
import json

model_bp = Blueprint("model", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
METRICS_PATH = os.path.join(BASE_DIR, "..", "..", "artifacts", "metrics.json")


@model_bp.route("/model/metrics")
def metrics():
    if not os.path.exists(METRICS_PATH):
        return jsonify({"error": "Model not trained yet. Run: python ml/train.py", "model_missing": True}), 503
    with open(METRICS_PATH) as f:
        data = json.load(f)
    return jsonify(data)


@model_bp.route("/model/feature-importance")
def feature_importance():
    if not os.path.exists(METRICS_PATH):
        return jsonify({"error": "Model not trained yet.", "model_missing": True}), 503
    with open(METRICS_PATH) as f:
        data = json.load(f)
    return jsonify({
        "feature_importances": data.get("feature_importances", {}),
        "features": list(data.get("feature_importances", {}).keys()),
    })


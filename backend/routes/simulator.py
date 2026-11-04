from flask import Blueprint, jsonify, request
import os
import json
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))
from predict import predict, validate_inputs, load_options

simulator_bp = Blueprint("simulator", __name__)


@simulator_bp.route("/simulator/options")
def options():
    try:
        opts = load_options()
        return jsonify(opts)
    except FileNotFoundError as e:
        return jsonify({"error": str(e), "model_missing": True}), 503


@simulator_bp.route("/simulator/predict", methods=["POST"])
def predict_sales():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        genre = data.get("genre")
        platform = data.get("platform")
        publisher = data.get("publisher", "Unknown")
        year = data.get("year")

        # Validate required fields
        missing = [f for f, v in [("genre", genre), ("platform", platform), ("year", year)] if not v]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        year = int(year)

        # Validate inputs against model categories
        errors = validate_inputs(genre, platform, publisher, year)
        if errors:
            return jsonify({"error": "Invalid inputs", "details": errors}), 422

        result = predict(genre=genre, platform=platform, publisher=publisher, year=year)

        return jsonify({
            "input": {"genre": genre, "platform": platform, "publisher": publisher, "year": year},
            "predictions": result,
            "disclaimer": (
                "These estimates are based on historical data (primarily 1980–2016). "
                "They reflect patterns from past releases and are not a guarantee of future sales performance."
            ),
        })

    except FileNotFoundError as e:
        return jsonify({"error": str(e), "model_missing": True}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@simulator_bp.route("/simulator/compare", methods=["POST"])
def compare_scenarios():
    try:
        data = request.get_json()
        if not data or "scenarios" not in data:
            return jsonify({"error": "Expected {scenarios: [...]}"}), 400

        scenarios = data["scenarios"]
        if not isinstance(scenarios, list) or len(scenarios) == 0:
            return jsonify({"error": "Scenarios must be a non-empty list"}), 400
        if len(scenarios) > 10:
            return jsonify({"error": "Maximum 10 scenarios allowed"}), 400

        results = []
        for s in scenarios:
            genre = s.get("genre")
            platform = s.get("platform")
            publisher = s.get("publisher", "Unknown")
            year = int(s.get("year", 2010))
            label = s.get("label", f"{genre} / {platform}")

            errors = validate_inputs(genre, platform, publisher, year)
            if errors:
                results.append({
                    "label": label,
                    "input": s,
                    "error": errors,
                    "predictions": None,
                })
                continue

            preds = predict(genre=genre, platform=platform, publisher=publisher, year=year)
            results.append({
                "label": label,
                "input": s,
                "predictions": preds,
            })

        # Determine best by global sales
        valid = [r for r in results if r["predictions"]]
        best = None
        if valid:
            best = max(valid, key=lambda r: r["predictions"].get("Global_Sales", 0))["label"]

        return jsonify({
            "scenarios": results,
            "best_scenario": best,
            "disclaimer": (
                "Comparison is based on historical market patterns. "
                "Real-world results depend on game quality, marketing, timing, and many other factors."
            ),
        })

    except FileNotFoundError as e:
        return jsonify({"error": str(e), "model_missing": True}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


from flask import Blueprint, jsonify
from services.data_service import DataService

overview_bp = Blueprint("overview", __name__)


@overview_bp.route("/overview")
def overview():
    try:
        ds = DataService.get_instance()
        stats = ds.stats
        df = ds.df

        # Top genres by sales
        top_genres = (
            df.groupby("Genre")["Global_Sales"]
            .sum()
            .sort_values(ascending=False)
            .head(5)
            .reset_index()
            .rename(columns={"Global_Sales": "total_sales"})
            .to_dict(orient="records")
        )

        # Top platforms
        top_platforms = (
            df.groupby("Platform")["Global_Sales"]
            .sum()
            .sort_values(ascending=False)
            .head(5)
            .reset_index()
            .rename(columns={"Global_Sales": "total_sales"})
            .to_dict(orient="records")
        )

        return jsonify({
            "stats": ds.safe_json(stats),
            "top_genres": ds.safe_json(top_genres),
            "top_platforms": ds.safe_json(top_platforms),
        })
    except FileNotFoundError as e:
        return jsonify({"error": str(e), "data_missing": True}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


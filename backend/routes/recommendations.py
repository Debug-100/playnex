from flask import Blueprint, jsonify, request
from services.data_service import DataService
import pandas as pd

recommendations_bp = Blueprint("recommendations", __name__)


@recommendations_bp.route("/recommendations")
def recommendations():
    try:
        ds = DataService.get_instance()
        df = ds.df

        genre = request.args.get("genre")
        platform = request.args.get("platform")

        recs = []

        # ---- 1. Best genre-platform combos ----
        combo = (
            df.groupby(["Genre", "Platform"])
            .agg(
                total_sales=("Global_Sales", "sum"),
                game_count=("Name", "count"),
                avg_sales=("Global_Sales", "mean"),
                median_sales=("Global_Sales", "median"),
            )
            .reset_index()
            .sort_values("avg_sales", ascending=False)
            .head(10)
        )
        recs.append({
            "type": "top_combos",
            "title": "Historically Strong Genre-Platform Combinations",
            "evidence": combo.to_dict(orient="records"),
            "explanation": "Ranked by average historical global sales per title across genre-platform combinations with sufficient data.",
        })

        # ---- 2. Region demand for selected genre ----
        if genre and genre != "All":
            genre_df = df[df["Genre"] == genre]
            if not genre_df.empty:
                region_sums = {
                    "NA": float(genre_df["NA_Sales"].sum()),
                    "EU": float(genre_df["EU_Sales"].sum()),
                    "JP": float(genre_df["JP_Sales"].sum()),
                    "Other": float(genre_df["Other_Sales"].sum()),
                }
                top_region = max(region_sums, key=region_sums.get)
                recs.append({
                    "type": "region_demand",
                    "title": f"Regional Demand for {genre} Games",
                    "evidence": region_sums,
                    "top_region": top_region,
                    "game_count": len(genre_df),
                    "explanation": f"Based on {len(genre_df)} historical {genre} titles in the dataset.",
                })

        # ---- 3. Comparable titles ----
        if genre:
            comp = df[df["Genre"] == genre] if genre != "All" else df
            if platform and platform != "All":
                comp = comp[comp["Platform"] == platform]
            top_comps = (
                comp.sort_values("Global_Sales", ascending=False)
                .head(10)[[c for c in ["Name", "Platform", "Publisher", "Year", "Global_Sales", "Critic_Score"] if c in df.columns]]
                .to_dict(orient="records")
            )
            if top_comps:
                recs.append({
                    "type": "comparable_titles",
                    "title": "Top Comparable Historical Titles",
                    "evidence": top_comps,
                    "explanation": "Top historically performing games matching your genre/platform selection.",
                })

        # ---- 4. Alternative platforms ----
        if genre and genre != "All":
            alt_platforms = (
                df[df["Genre"] == genre]
                .groupby("Platform")
                .agg(avg_sales=("Global_Sales", "mean"), game_count=("Name", "count"))
                .reset_index()
                .query("game_count >= 5")
                .sort_values("avg_sales", ascending=False)
                .head(8)
                .to_dict(orient="records")
            )
            recs.append({
                "type": "alt_platforms",
                "title": f"Platforms Worth Considering for {genre}",
                "evidence": alt_platforms,
                "explanation": f"Platforms with at least 5 historical {genre} titles, ranked by average sales.",
            })

        return jsonify(ds.safe_json(recs))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


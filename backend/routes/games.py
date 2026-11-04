from flask import Blueprint, jsonify, request
from services.data_service import DataService
import pandas as pd
import math

games_bp = Blueprint("games", __name__)

PAGE_SIZE = 20


@games_bp.route("/games")
def get_games():
    try:
        ds = DataService.get_instance()
        df = ds.df.copy()

        # Filters
        query = request.args.get("q", "").strip().lower()
        genre = request.args.get("genre")
        platform = request.args.get("platform")
        publisher = request.args.get("publisher")
        year_from = request.args.get("year_from")
        year_to = request.args.get("year_to")
        sort_by = request.args.get("sort_by", "Global_Sales")
        sort_dir = request.args.get("sort_dir", "desc")
        page = int(request.args.get("page", 1))

        if query:
            df = df[df["Name"].str.lower().str.contains(query, na=False)]
        if genre and genre != "All":
            df = df[df["Genre"] == genre]
        if platform and platform != "All":
            df = df[df["Platform"] == platform]
        if publisher and publisher != "All":
            df = df[df["Publisher"] == publisher]
        if year_from:
            df = df[df["Year"] >= int(year_from)]
        if year_to:
            df = df[df["Year"] <= int(year_to)]

        # Sort
        if sort_by in df.columns:
            df = df.sort_values(sort_by, ascending=(sort_dir == "asc"), na_position="last")

        total = len(df)
        total_pages = math.ceil(total / PAGE_SIZE)
        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE

        cols = [c for c in [
            "Name", "Platform", "Genre", "Publisher", "Year",
            "Global_Sales", "NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales",
            "Critic_Score", "User_Score", "Developer", "Rating"
        ] if c in df.columns]

        records = df[cols].iloc[start:end].to_dict(orient="records")

        return jsonify(ds.safe_json({
            "games": records,
            "total": total,
            "page": page,
            "total_pages": total_pages,
            "page_size": PAGE_SIZE,
        }))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@games_bp.route("/games/compare")
def compare_games():
    try:
        ds = DataService.get_instance()
        df = ds.df

        names = request.args.getlist("names")
        if not names:
            return jsonify({"error": "No game names provided"}), 400

        results = []
        for name in names:
            match = df[df["Name"].str.lower() == name.lower()]
            if not match.empty:
                row = match.iloc[0]
                results.append({
                    col: row[col] for col in [
                        "Name", "Platform", "Genre", "Publisher", "Year",
                        "Global_Sales", "NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales",
                        "Critic_Score", "User_Score"
                    ] if col in df.columns
                })

        return jsonify(ds.safe_json(results))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


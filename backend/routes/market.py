from flask import Blueprint, jsonify, request
from services.data_service import DataService
import pandas as pd

market_bp = Blueprint("market", __name__)


def get_filters():
    return {
        "genre": request.args.get("genre"),
        "platform": request.args.get("platform"),
        "publisher": request.args.get("publisher"),
        "year_from": request.args.get("year_from"),
        "year_to": request.args.get("year_to"),
    }


@market_bp.route("/market/genres")
def genres():
    try:
        ds = DataService.get_instance()
        f = get_filters()
        df = ds.filter(**f)

        result = (
            df.groupby("Genre")
            .agg(
                total_sales=("Global_Sales", "sum"),
                game_count=("Name", "count"),
                avg_sales=("Global_Sales", "mean"),
                na_sales=("NA_Sales", "sum"),
                eu_sales=("EU_Sales", "sum"),
                jp_sales=("JP_Sales", "sum"),
                other_sales=("Other_Sales", "sum"),
            )
            .reset_index()
            .sort_values("total_sales", ascending=False)
            .to_dict(orient="records")
        )
        return jsonify(ds.safe_json(result))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@market_bp.route("/market/platforms")
def platforms():
    try:
        ds = DataService.get_instance()
        f = get_filters()
        df = ds.filter(**f)

        result = (
            df.groupby("Platform")
            .agg(
                total_sales=("Global_Sales", "sum"),
                game_count=("Name", "count"),
                avg_sales=("Global_Sales", "mean"),
                na_sales=("NA_Sales", "sum"),
                eu_sales=("EU_Sales", "sum"),
                jp_sales=("JP_Sales", "sum"),
                other_sales=("Other_Sales", "sum"),
            )
            .reset_index()
            .sort_values("total_sales", ascending=False)
            .to_dict(orient="records")
        )
        return jsonify(ds.safe_json(result))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@market_bp.route("/market/regions")
def regions():
    try:
        ds = DataService.get_instance()
        f = get_filters()
        df = ds.filter(**f)

        region_sales = {
            "NA": float(df["NA_Sales"].sum()) if "NA_Sales" in df.columns else 0,
            "EU": float(df["EU_Sales"].sum()) if "EU_Sales" in df.columns else 0,
            "JP": float(df["JP_Sales"].sum()) if "JP_Sales" in df.columns else 0,
            "Other": float(df["Other_Sales"].sum()) if "Other_Sales" in df.columns else 0,
        }
        total = sum(region_sales.values()) or 1
        region_pct = {k: round(v / total * 100, 2) for k, v in region_sales.items()}

        # Genre preferences by region
        genre_region = None
        if "NA_Sales" in df.columns:
            genre_region = (
                df.groupby("Genre")[["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"]]
                .sum()
                .reset_index()
                .to_dict(orient="records")
            )

        return jsonify(ds.safe_json({
            "region_sales": region_sales,
            "region_pct": region_pct,
            "genre_region": genre_region,
        }))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@market_bp.route("/market/trends")
def trends():
    try:
        ds = DataService.get_instance()
        f = get_filters()
        df = ds.filter(**f)

        result = (
            df.groupby("Year")
            .agg(
                total_sales=("Global_Sales", "sum"),
                game_count=("Name", "count"),
                avg_sales=("Global_Sales", "mean"),
            )
            .reset_index()
            .sort_values("Year")
            .to_dict(orient="records")
        )
        return jsonify(ds.safe_json(result))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@market_bp.route("/market/filters")
def filter_options():
    """Return all unique values for filter dropdowns."""
    try:
        ds = DataService.get_instance()
        df = ds.df
        return jsonify({
            "genres": sorted(df["Genre"].dropna().unique().tolist()),
            "platforms": sorted(df["Platform"].dropna().unique().tolist()),
            "publishers": sorted(df[df["Publisher"] != "Unknown"]["Publisher"].dropna().unique().tolist()),
            "years": sorted(df["Year"].dropna().unique().astype(int).tolist()),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@market_bp.route("/market/insights")
def insights():
    """Auto-generated insights from the filtered dataset."""
    try:
        ds = DataService.get_instance()
        f = get_filters()
        df = ds.filter(**f)

        insights_list = []

        # Highest-selling genre
        top_genre = df.groupby("Genre")["Global_Sales"].sum().idxmax()
        top_genre_sales = df.groupby("Genre")["Global_Sales"].sum().max()
        insights_list.append({
            "type": "top_genre",
            "title": "Highest-Selling Genre",
            "value": top_genre,
            "detail": f"{top_genre_sales:.1f}M total historical sales",
        })

        # Top platform
        top_platform = df.groupby("Platform")["Global_Sales"].sum().idxmax()
        top_plat_sales = df.groupby("Platform")["Global_Sales"].sum().max()
        insights_list.append({
            "type": "top_platform",
            "title": "Strongest Platform",
            "value": top_platform,
            "detail": f"{top_plat_sales:.1f}M total sales across {len(df[df['Platform']==top_platform])} titles",
        })

        # Top region
        region_cols = {c: c.replace("_Sales", "") for c in ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"] if c in df.columns}
        if region_cols:
            region_totals = {col: df[col].sum() for col in region_cols}
            top_region_col = max(region_totals, key=region_totals.get)
            insights_list.append({
                "type": "top_region",
                "title": "Dominant Region",
                "value": region_cols[top_region_col],
                "detail": f"{region_totals[top_region_col]:.1f}M total sales",
            })

        return jsonify(ds.safe_json(insights_list))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


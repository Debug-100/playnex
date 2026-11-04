"""
PLAYNEX — ML Preprocessing Pipeline
Cleans the raw video game sales CSV and saves a processed version.
"""

import pandas as pd
import numpy as np
import os
import json
import warnings
warnings.filterwarnings("ignore")

RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "Video_Games_Sales_as_at_22_Dec_2016.csv")
ALT_RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "vgsales.csv")
PROCESSED_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "cleaned_games.csv")
STATS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "dataset_stats.json")


def load_raw_dataset():
    """Attempt to load the primary dataset, then fallback to alternative."""
    if os.path.exists(RAW_PATH):
        print(f"[INFO] Loading primary dataset: {RAW_PATH}")
        df = pd.read_csv(RAW_PATH, encoding="latin-1")
        return df, "primary"
    elif os.path.exists(ALT_RAW_PATH):
        print(f"[INFO] Loading alternative dataset: {ALT_RAW_PATH}")
        df = pd.read_csv(ALT_RAW_PATH, encoding="latin-1")
        return df, "alternative"
    else:
        raise FileNotFoundError(
            "\n\n[PLAYNEX ERROR] Dataset not found!\n"
            "Please download the dataset from Kaggle and place it in data/raw/:\n"
            "  Primary: https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings\n"
            "    -> Rename to: Video_Games_Sales_as_at_22_Dec_2016.csv\n"
            "  Alternative: https://www.kaggle.com/datasets/gregorut/videogamesales\n"
            "    -> Rename to: vgsales.csv\n"
        )


def inspect_dataset(df, source):
    """Print dataset overview for transparency."""
    print(f"\n{'='*60}")
    print(f"DATASET INSPECTION ({source})")
    print(f"{'='*60}")
    print(f"Shape: {df.shape}")
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nDtypes:\n{df.dtypes}")
    print(f"\nMissing values:\n{df.isnull().sum()}")
    print(f"\nFirst 3 rows:\n{df.head(3)}")
    print(f"{'='*60}\n")


def preprocess(df, source):
    """Full preprocessing pipeline. Returns cleaned DataFrame."""
    print("[STEP 1] Starting preprocessing...")

    # ---- 1. Remove duplicates ----
    before = len(df)
    df = df.drop_duplicates()
    print(f"[STEP 1] Removed {before - len(df)} duplicate rows. Remaining: {len(df)}")

    # ---- 2. Normalize column names ----
    df.columns = df.columns.str.strip()

    # ---- 3. Determine which columns we have ----
    has_ratings = "Critic_Score" in df.columns
    has_developer = "Developer" in df.columns
    has_rating = "Rating" in df.columns  # ESRB rating

    # ---- 4. Handle Name ----
    df = df.dropna(subset=["Name"])
    df["Name"] = df["Name"].str.strip()

    # ---- 5. Handle Year_of_Release / Year ----
    year_col = "Year_of_Release" if "Year_of_Release" in df.columns else "Year"
    df[year_col] = pd.to_numeric(df[year_col], errors="coerce")
    # Drop rows with obviously invalid years
    df = df[df[year_col].between(1980, 2020, inclusive="both") | df[year_col].isna()]
    # Fill median year per platform if missing
    median_year = df.groupby("Platform")[year_col].transform("median")
    df[year_col] = df[year_col].fillna(median_year).fillna(df[year_col].median())
    df[year_col] = df[year_col].astype(int)
    df = df.rename(columns={year_col: "Year"})

    # ---- 6. Handle Genre ----
    df["Genre"] = df["Genre"].fillna("Unknown").str.strip()

    # ---- 7. Handle Publisher ----
    df["Publisher"] = df["Publisher"].fillna("Unknown").str.strip()

    # ---- 8. Handle Platform ----
    df["Platform"] = df["Platform"].fillna("Unknown").str.strip()

    # ---- 9. Handle sales columns ----
    sales_cols = [c for c in ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales", "Global_Sales"] if c in df.columns]
    for col in sales_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    # ---- 10. Drop rows with 0 or missing Global_Sales ----
    if "Global_Sales" in df.columns:
        df = df[df["Global_Sales"] > 0]

    # ---- 11. Handle Critic_Score, User_Score if present ----
    if has_ratings:
        df["Critic_Score"] = pd.to_numeric(df["Critic_Score"], errors="coerce")
        # User_Score has 'tbd' values
        df["User_Score"] = df["User_Score"].replace("tbd", np.nan)
        df["User_Score"] = pd.to_numeric(df["User_Score"], errors="coerce")
        df["Critic_Count"] = pd.to_numeric(df.get("Critic_Count", pd.Series(dtype=float)), errors="coerce")
        df["User_Count"] = pd.to_numeric(df.get("User_Count", pd.Series(dtype=float)), errors="coerce")

    if has_developer:
        df["Developer"] = df["Developer"].fillna("Unknown").str.strip()

    if has_rating:
        df["Rating"] = df["Rating"].fillna("Unknown").str.strip()

    # ---- 12. Outlier inspection (keep outliers, just log them) ----
    if "Global_Sales" in df.columns:
        q99 = df["Global_Sales"].quantile(0.99)
        outliers = df[df["Global_Sales"] > q99]
        print(f"[STEP 12] Outliers (top 1% by Global_Sales, >{q99:.2f}M): {len(outliers)} titles")

    # ---- 13. Normalize categorical values ----
    df["Genre"] = df["Genre"].str.title()
    df["Platform"] = df["Platform"].str.strip()

    print(f"[DONE] Final dataset shape: {df.shape}")
    return df


def save_processed(df):
    os.makedirs(os.path.dirname(PROCESSED_PATH), exist_ok=True)
    df.to_csv(PROCESSED_PATH, index=False)
    print(f"[SAVED] Processed dataset -> {PROCESSED_PATH}")


def save_stats(df):
    """Persist dataset statistics for quick API responses."""
    sales_cols = [c for c in ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales", "Global_Sales"] if c in df.columns]
    stats = {
        "total_games": len(df),
        "total_global_sales": float(df["Global_Sales"].sum()) if "Global_Sales" in df.columns else 0,
        "avg_sales": float(df["Global_Sales"].mean()) if "Global_Sales" in df.columns else 0,
        "num_platforms": int(df["Platform"].nunique()),
        "num_genres": int(df["Genre"].nunique()),
        "num_publishers": int(df["Publisher"].nunique()),
        "year_range": [int(df["Year"].min()), int(df["Year"].max())],
        "genres": sorted(df["Genre"].unique().tolist()),
        "platforms": sorted(df["Platform"].unique().tolist()),
        "publishers": sorted(df[df["Publisher"] != "Unknown"]["Publisher"].unique().tolist()),
        "has_ratings": "Critic_Score" in df.columns,
        "has_developer": "Developer" in df.columns,
    }
    os.makedirs(os.path.dirname(STATS_PATH), exist_ok=True)
    with open(STATS_PATH, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"[SAVED] Dataset stats -> {STATS_PATH}")
    return stats


def run():
    df_raw, source = load_raw_dataset()
    inspect_dataset(df_raw, source)
    df_clean = preprocess(df_raw, source)
    save_processed(df_clean)
    stats = save_stats(df_clean)
    print("\n[PLAYNEX] Preprocessing complete.")
    print(f"  Total games: {stats['total_games']}")
    print(f"  Year range: {stats['year_range']}")
    print(f"  Genres: {stats['num_genres']}")
    print(f"  Platforms: {stats['num_platforms']}")
    return df_clean


if __name__ == "__main__":
    run()


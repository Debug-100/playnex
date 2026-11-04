"""
PLAYNEX — DataService
Singleton that loads and caches the processed dataset and stats.
"""

import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_PATH = os.path.join(BASE_DIR, "..", "..", "data", "processed", "cleaned_games.csv")
STATS_PATH = os.path.join(BASE_DIR, "..", "..", "data", "processed", "dataset_stats.json")


class DataService:
    _instance = None

    def __init__(self):
        self.df = self._load()
        self.stats = self._compute_stats()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load(self):
        if not os.path.exists(PROCESSED_PATH):
            raise FileNotFoundError(
                "Processed dataset not found. Run: python ml/preprocessing.py"
            )
        df = pd.read_csv(PROCESSED_PATH, low_memory=False)
        # Ensure numeric types
        for col in ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales", "Global_Sales", "Year"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        for col in ["Critic_Score", "User_Score", "Critic_Count", "User_Count"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        return df

    def _compute_stats(self):
        df = self.df
        return {
            "total_games": len(df),
            "total_global_sales": float(df["Global_Sales"].sum()) if "Global_Sales" in df.columns else 0,
            "avg_sales": float(df["Global_Sales"].mean()) if "Global_Sales" in df.columns else 0,
            "num_platforms": int(df["Platform"].nunique()),
            "num_genres": int(df["Genre"].nunique()),
            "num_publishers": int(df["Publisher"].nunique()),
            "year_range": [int(df["Year"].min()), int(df["Year"].max())],
            "has_ratings": "Critic_Score" in df.columns,
        }

    def filter(self, genre=None, platform=None, publisher=None,
               year_from=None, year_to=None):
        """Return a filtered copy of the dataset."""
        df = self.df.copy()
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
        return df

    def safe_json(self, obj):
        """Convert numpy/pandas types to JSON-safe Python types."""
        if isinstance(obj, dict):
            return {k: self.safe_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.safe_json(i) for i in obj]
        elif isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif pd.isna(obj) if not isinstance(obj, (list, dict, np.ndarray)) else False:
            return None
        return obj


"""
PLAYNEX — Random Forest Regression Training
Trains a multi-output RandomForestRegressor to estimate regional + global game sales.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.dummy import DummyRegressor

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_PATH = os.path.join(BASE_DIR, "..", "data", "processed", "cleaned_games.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "..", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")
ENCODER_PATH = os.path.join(ARTIFACTS_DIR, "encoder.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "metrics.json")
OPTIONS_PATH = os.path.join(ARTIFACTS_DIR, "model_options.json")

RANDOM_SEED = 42

# Target columns we predict
TARGETS = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales", "Global_Sales"]

# Input features (pre-launch info only)
FEATURE_COLS = ["Genre", "Platform", "Publisher", "Year"]


def load_data():
    if not os.path.exists(PROCESSED_PATH):
        print("[ERROR] Processed dataset not found. Run ml/preprocessing.py first.")
        sys.exit(1)
    df = pd.read_csv(PROCESSED_PATH)
    print(f"[INFO] Loaded processed dataset: {df.shape}")
    return df


def prepare_features(df):
    """Filter to rows with all required columns and targets."""
    available_targets = [t for t in TARGETS if t in df.columns]
    if not available_targets:
        raise ValueError("No target sales columns found in dataset.")

    required = FEATURE_COLS + available_targets
    df = df.dropna(subset=required)
    df = df[df[available_targets].gt(0).any(axis=1)]

    print(f"[INFO] Rows with all features & targets: {len(df)}")
    return df, available_targets


def build_pipeline(X_train):
    """Build preprocessing + RF pipeline."""
    cat_features = ["Genre", "Platform", "Publisher"]
    num_features = ["Year"]

    # Collect all categories from training data
    categories = [X_train[col].astype(str).unique().tolist() for col in cat_features]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OrdinalEncoder(
                    categories=categories,
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                ),
                cat_features,
            ),
        ],
        remainder="passthrough",  # passes Year through
    )

    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=3,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", rf),
    ])
    return pipeline


def evaluate(pipeline, X_test, y_test, targets, split_info):
    """Compute evaluation metrics for each target."""
    y_pred = pipeline.predict(X_test)
    if y_pred.ndim == 1:
        y_pred = y_pred.reshape(-1, 1)

    metrics_per_target = {}
    for i, target in enumerate(targets):
        y_t = y_test.iloc[:, i] if hasattr(y_test, "iloc") else y_test[:, i]
        y_p = y_pred[:, i]
        r2 = r2_score(y_t, y_p)
        mae = mean_absolute_error(y_t, y_p)
        rmse = np.sqrt(mean_squared_error(y_t, y_p))
        metrics_per_target[target] = {"r2": round(float(r2), 4), "mae": round(float(mae), 4), "rmse": round(float(rmse), 4)}
        print(f"  [{target}] R²={r2:.4f}  MAE={mae:.4f}M  RMSE={rmse:.4f}M")

    return metrics_per_target, y_pred


def evaluate_baseline(X_train, y_train, X_test, y_test, targets):
    """Mean-prediction baseline for comparison."""
    baseline_metrics = {}
    for i, target in enumerate(targets):
        y_tr = y_train.iloc[:, i] if hasattr(y_train, "iloc") else y_train[:, i]
        y_t = y_test.iloc[:, i] if hasattr(y_test, "iloc") else y_test[:, i]
        dummy = DummyRegressor(strategy="mean")
        dummy.fit(X_train, y_tr)
        y_pred_baseline = dummy.predict(X_test)
        r2 = r2_score(y_t, y_pred_baseline)
        mae = mean_absolute_error(y_t, y_pred_baseline)
        rmse = np.sqrt(mean_squared_error(y_t, y_pred_baseline))
        baseline_metrics[target] = {"r2": round(float(r2), 4), "mae": round(float(mae), 4), "rmse": round(float(rmse), 4)}
    return baseline_metrics


def get_feature_importances(pipeline, targets):
    rf_model = pipeline.named_steps["model"]
    # MultiOutputRegressor exposes estimators_
    if hasattr(rf_model, "estimators_"):
        # Already a single RF with multi-output
        importances = rf_model.feature_importances_
    else:
        importances = np.zeros(len(FEATURE_COLS))

    feature_names = ["Genre", "Platform", "Publisher", "Year"]
    return dict(zip(feature_names, [round(float(v), 4) for v in importances]))


def save_artifacts(pipeline, metrics_per_target, baseline_metrics, feature_importances, split_info, targets):
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[SAVED] Model -> {MODEL_PATH}")

    metrics = {
        "targets": targets,
        "split": split_info,
        "random_forest": metrics_per_target,
        "baseline": baseline_metrics,
        "feature_importances": feature_importances,
        "model_params": {
            "n_estimators": 200,
            "max_depth": 15,
            "min_samples_leaf": 3,
            "random_seed": RANDOM_SEED,
        },
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[SAVED] Metrics -> {METRICS_PATH}")


def save_model_options(df):
    """Save valid dropdown options from the actual training data."""
    options = {
        "genres": sorted(df["Genre"].unique().tolist()),
        "platforms": sorted(df["Platform"].unique().tolist()),
        "publishers": sorted(df[df["Publisher"] != "Unknown"]["Publisher"].unique().tolist()),
        "years": sorted(df["Year"].unique().tolist()),
    }
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with open(OPTIONS_PATH, "w") as f:
        json.dump(options, f, indent=2)
    print(f"[SAVED] Model options -> {OPTIONS_PATH}")


def train():
    print("\n" + "=" * 60)
    print("PLAYNEX — Training Random Forest Regression Model")
    print("=" * 60)

    df = load_data()
    df, targets = prepare_features(df)
    save_model_options(df)

    X = df[FEATURE_COLS].copy()
    y = df[targets].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    split_info = {
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "total_samples": len(X),
        "test_ratio": 0.2,
        "random_seed": RANDOM_SEED,
    }
    print(f"\n[SPLIT] Train: {split_info['train_samples']} | Test: {split_info['test_samples']}")

    print("\n[TRAINING] Fitting RandomForestRegressor (multi-output)...")
    pipeline = build_pipeline(X_train)
    pipeline.fit(X_train, y_train)
    print("[TRAINING] Done.")

    print("\n[EVALUATION] Random Forest:")
    metrics_per_target, y_pred = evaluate(pipeline, X_test, y_test, targets, split_info)

    print("\n[EVALUATION] Baseline (mean prediction):")
    baseline_metrics = evaluate_baseline(X_train, y_train, X_test, y_test, targets)
    for t, m in baseline_metrics.items():
        print(f"  [{t}] R²={m['r2']}  MAE={m['mae']}M  RMSE={m['rmse']}M")

    feature_importances = get_feature_importances(pipeline, targets)
    print(f"\n[FEATURES] Importances: {feature_importances}")

    save_artifacts(pipeline, metrics_per_target, baseline_metrics, feature_importances, split_info, targets)

    print("\n[PLAYNEX] Training complete!")
    return pipeline, metrics_per_target


if __name__ == "__main__":
    train()


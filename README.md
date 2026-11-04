# PLAYNEX — Game Launch Strategy Advisor

> **Build smarter. Launch strategically.**

PLAYNEX is a data-driven game launch strategy platform that helps independent game developers and small studios make informed decisions before releasing their games. It analyses historical video game sales data using **Random Forest Regression** to provide market research, competitor benchmarking, ML-based sales estimation, and data-backed launch recommendations.

---

## Problem Statement

Independent game developers often launch games without understanding the competitive landscape or historical market dynamics. Without data-driven insights, they risk:
- Targeting oversaturated genre-platform combinations.
- Misjudging regional demand for their genre.
- Under- or overestimating realistic sales benchmarks.
- Missing historically strong publisher or platform patterns.

PLAYNEX addresses these problems by making historical market intelligence accessible and interactive.

---

## Objectives

1. Enable historical gaming market research through interactive visualisations.
2. Provide competitor intelligence via searchable, filterable game data.
3. Estimate historical sales performance for hypothetical game configurations using Random Forest.
4. Surface data-backed launch recommendations with supporting evidence.
5. Deliver a production-quality, visually polished SaaS-style interface.

---

## Dataset Sources

**Primary (required):**
- **Video Game Sales with Ratings** — [Kaggle](https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings)
  - `Video_Games_Sales_as_at_22_Dec_2016.csv`
  - Contains: Name, Platform, Year, Genre, Publisher, NA/EU/JP/Other/Global Sales, Critic Score, User Score, Developer, Rating (ESRB), and review counts.

**Alternative (fallback):**
- **Video Game Sales** — [Kaggle](https://www.kaggle.com/datasets/gregorut/videogamesales)
  - `vgsales.csv`
  - Contains: Name, Platform, Year, Genre, Publisher, NA/EU/JP/Other/Global Sales.

---

## Dataset Attributes

| Column | Type | Description |
|---|---|---|
| Name | string | Game title |
| Platform | string | Console/platform |
| Year_of_Release | numeric | Release year (1980–2016) |
| Genre | string | Game genre |
| Publisher | string | Publishing company |
| NA_Sales | float | North American sales (millions) |
| EU_Sales | float | European sales (millions) |
| JP_Sales | float | Japanese sales (millions) |
| Other_Sales | float | Rest-of-world sales (millions) |
| Global_Sales | float | Worldwide sales (millions) |
| Critic_Score | float | Metacritic score (0–100) |
| User_Score | float | Metacritic user score (0–10) |
| Developer | string | Development studio |
| Rating | string | ESRB rating |

---

## Preprocessing Methodology

The preprocessing pipeline (`ml/preprocessing.py`) performs:

1. **Duplicate removal** — Exact duplicate rows are dropped.
2. **Missing year handling** — Invalid years outside [1980, 2020] are removed; missing years are imputed using the median year per platform.
3. **User_Score normalisation** — `tbd` values are coerced to `NaN`; the column is converted to numeric.
4. **Categorical cleaning** — Genre, Publisher, Platform fields are stripped and normalised with title-case formatting.
5. **Missing categoricals** — `NaN` genres, publishers, and platforms are replaced with `"Unknown"`.
6. **Zero-sales filtering** — Games with Global_Sales ≤ 0 are removed.
7. **Outlier inspection** — Top 1% by Global_Sales are logged but not removed (legitimate blockbusters).
8. **Processed dataset saved** — `data/processed/cleaned_games.csv` preserves the cleaned version without modifying raw data.
9. **Statistics persisted** — `data/processed/dataset_stats.json` caches aggregate metrics for fast API responses.

---

## Random Forest Regression

### Why Random Forest?

Random Forest Regression is well-suited for this problem because:

- **Non-linearity**: Game sales do not follow a linear pattern. Random Forest captures complex interactions between genre, platform, publisher, and year.
- **Feature importance**: The model inherently ranks which features most influence sales estimates.
- **Robustness to outliers**: Averaging across many trees reduces sensitivity to blockbuster outliers.
- **Handles categorical features**: After ordinal encoding, the model processes mixed feature types naturally.
- **No strong distributional assumptions**: Unlike linear regression, it makes no assumptions about residual normality.

### Model Configuration

| Parameter | Value |
|---|---|
| Estimators | 200 |
| Max depth | 15 |
| Min samples leaf | 3 |
| Random seed | 42 |
| Multi-output | Yes (single model predicts all 5 targets) |

### Input Features (Pre-launch only)

| Feature | Description |
|---|---|
| Genre | Primary genre |
| Platform | Target platform |
| Publisher | Publisher name |
| Year | Release year reference |

**Excluded** (post-release, would cause target leakage): `Critic_Score`, `User_Score`, `Critic_Count`, `User_Count`, any sales figures.

### Prediction Targets

- `NA_Sales` — North American sales (millions)
- `EU_Sales` — European sales (millions)
- `JP_Sales` — Japanese sales (millions)
- `Other_Sales` — Rest-of-world sales (millions)
- `Global_Sales` — Worldwide sales (millions)

### Training Methodology

- 80/20 stratified split, `random_state=42`.
- `OrdinalEncoder` with `handle_unknown='use_encoded_value'` and `unknown_value=-1` for safe handling of unseen categories.
- Preprocessing and model assembled into a scikit-learn `Pipeline`.
- Model persisted with **Joblib** to `artifacts/model.joblib`.
- Compared against a **mean-prediction baseline** (`DummyRegressor`), not another ML algorithm.

### Evaluation Metrics

Metrics are computed on the held-out 20% test set and saved to `artifacts/metrics.json`:

| Metric | Description |
|---|---|
| R² Score | Proportion of variance explained (1.0 = perfect) |
| MAE | Mean Absolute Error in millions of units |
| RMSE | Root Mean Squared Error in millions of units |

---

## System Architecture

```
PLAYNEX/
├── data/
│   ├── raw/                    # Place Kaggle CSV here (unchanged)
│   └── processed/              # Cleaned dataset + stats JSON
├── artifacts/
│   ├── model.joblib            # Trained Random Forest pipeline
│   ├── metrics.json            # Evaluation results
│   └── model_options.json      # Valid dropdown values
├── ml/
│   ├── preprocessing.py        # Data cleaning pipeline
│   ├── train.py                # Model training + evaluation
│   └── predict.py              # Inference service
├── backend/
│   ├── app.py                  # Flask application + CORS
│   ├── routes/                 # API route blueprints
│   └── services/               # DataService singleton
└── frontend/
    └── src/
        ├── pages/              # Route-level components
        ├── components/         # Shared UI components
        └── services/api.ts     # Axios API client
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React, React Router |
| **Backend** | Python, Flask, Flask-CORS, Pandas, NumPy |
| **Machine Learning** | scikit-learn (RandomForestRegressor, Pipeline, OrdinalEncoder), Joblib |
| **Storage** | Local CSV files, JSON artifacts |

---

## Application Modules

### Module 1 — Market Research
Interactive market overview with filters by genre, platform, year. Visualisations: genre sales bar chart, platform comparison, regional pie chart, historical trend line, auto-generated insights.

### Module 2 — Competitor Analysis
Searchable, filterable, paginated game table. Select up to 5 titles for side-by-side comparison (sales, scores, regional breakdown).

### Module 3 — Launch Simulator *(Centrepiece)*
Configure genre, platform, publisher, year → get a Random Forest sales estimate. Displays global + regional predictions, charts, and a strategy comparison table for multiple configurations.

### Module 4 — Recommendations
Evidence-based recommendations: top genre-platform combos, regional demand analysis, comparable competitor titles, and alternative platform suggestions — all with supporting statistics.

### Model Performance
Live display of training/test split, R², MAE, RMSE per target, comparison vs. baseline, and feature importance chart.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/overview` | Dashboard stats + top genres/platforms |
| GET | `/api/market/genres` | Genre stats (filterable) |
| GET | `/api/market/platforms` | Platform stats (filterable) |
| GET | `/api/market/regions` | Regional sales distribution |
| GET | `/api/market/trends` | Year-over-year trends |
| GET | `/api/market/insights` | Auto-generated insights |
| GET | `/api/market/filters` | Dropdown options |
| GET | `/api/games` | Search + filter + paginate games |
| GET | `/api/games/compare` | Compare specific titles |
| GET | `/api/simulator/options` | Valid model inputs |
| POST | `/api/simulator/predict` | Generate sales prediction |
| POST | `/api/simulator/compare` | Compare multiple scenarios |
| GET | `/api/model/metrics` | Evaluation metrics |
| GET | `/api/model/feature-importance` | Feature importances |
| GET | `/api/recommendations` | Evidence-based recommendations |

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Dataset Setup

> **Important:** The dataset must be downloaded manually from Kaggle.

1. Download from: https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings
2. Place the CSV in: `data/raw/Video_Games_Sales_as_at_22_Dec_2016.csv`

Alternatively, download `vgsales.csv` from the alternative link and place it in `data/raw/vgsales.csv`.

---

## Running PLAYNEX

### Step 1: Run the data pipeline (once)

```bash
python ml/preprocessing.py
python ml/train.py
```

Or use the convenience script:
```
run_pipeline.bat
```

### Step 2: Start the backend

```bash
cd backend
python app.py
```

Or: `start_backend.bat` → runs at http://localhost:5000

### Step 3: Start the frontend

```bash
cd frontend
npm run dev
```

Or: `start_frontend.bat` → opens at http://localhost:5173

---

## Known Limitations

1. **Historical data only**: The dataset covers primarily 1980–2016. Modern mobile, indie, and digital-only releases are under-represented.
2. **Physical sales focus**: The original dataset represents physical retail sales tracked by VGChartz. Digital sales, DLC, and free-to-play monetisation are absent.
3. **Publisher bias**: Some publishers have hundreds of titles; others have one. Publisher-based predictions may reflect quantity effects.
4. **Regional sparsity**: JP_Sales data is thin for many Western genres. Japanese market predictions have higher uncertainty.
5. **No temporal forecasting**: The model does not extrapolate market trends forward. Year inputs are reference points for historical conditions only.
6. **Not a commercial guarantee**: PLAYNEX is a decision-support tool based on historical patterns. Real-world success depends on game quality, marketing, timing, and many factors not in the dataset.

---

*PLAYNEX — Build smarter. Launch strategically.*


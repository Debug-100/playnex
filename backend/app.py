"""
PLAYNEX — Flask Backend
Main application entry point.
"""

import os
import sys

# Add parent to path so ml/ modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS

from routes.health import health_bp
from routes.overview import overview_bp
from routes.market import market_bp
from routes.games import games_bp
from routes.simulator import simulator_bp
from routes.recommendations import recommendations_bp
from routes.model_metrics import model_bp

from services.data_service import DataService

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Register blueprints
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(overview_bp, url_prefix="/api")
app.register_blueprint(market_bp, url_prefix="/api")
app.register_blueprint(games_bp, url_prefix="/api")
app.register_blueprint(simulator_bp, url_prefix="/api")
app.register_blueprint(recommendations_bp, url_prefix="/api")
app.register_blueprint(model_bp, url_prefix="/api")


@app.errorhandler(404)
def not_found(e):
    return {"error": "Endpoint not found", "status": 404}, 404


@app.errorhandler(500)
def server_error(e):
    return {"error": str(e), "status": 500}, 500


if __name__ == "__main__":
    print("[PLAYNEX] Starting backend server...")
    # Eagerly load data on startup
    try:
        ds = DataService.get_instance()
        print(f"[PLAYNEX] Dataset loaded: {len(ds.df)} games")
    except Exception as ex:
        print(f"[PLAYNEX WARNING] Could not load dataset: {ex}")

    app.run(debug=True, port=5000, host="0.0.0.0")


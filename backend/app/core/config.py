"""Application configuration settings."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Database
DATABASE_URL = f"sqlite:///{BASE_DIR}/drainage.db"

# Demo mode
DEMO_MODE = True
DEMO_LABEL = "DEMO/SIMULATED"

# App metadata
APP_NAME = "Smart Urban Drainage Plastic Blockage Analysis & Prevention System"
APP_VERSION = "1.0.0"

# Risk score default weights (must sum to 1.0)
DEFAULT_RISK_WEIGHTS = {
    "blockage_frequency": 0.30,
    "plastic_involvement": 0.20,
    "rainfall_association": 0.20,
    "drain_condition": 0.10,
    "nearby_activity": 0.10,
    "cleaning_age": 0.10,
}

# Risk thresholds
RISK_LOW_MAX = 30
RISK_MEDIUM_MAX = 60
# > 60 = HIGH

# ML minimum records required
ML_MIN_RECORDS = 50

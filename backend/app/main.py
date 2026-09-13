"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import APP_NAME, APP_VERSION
from app.db.database import create_db_and_tables
from app.db.seed_demo import seed
from app.routers.drains import router as drains_router
from app.routers.incidents import router as incidents_router
from app.routers.analytics import router as analytics_router
from app.routers.risk import router as risk_router
from app.routers.interventions import router as interventions_router
from app.routers.misc import (
    rainfall_router, cleaning_router, users_router,
    datasources_router, hotspot_router, ml_router, import_router
)

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "GIS-based municipal decision-support platform for drainage blockage analysis. "
        "Demo data is clearly labelled DEMO/SIMULATED and must not be used as real research data."
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed()


@app.get("/")
def root():
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "demo_mode": True,
        "warning": "All data is DEMO/SIMULATED unless explicitly marked otherwise.",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# Register all routers
app.include_router(drains_router, prefix="/api", tags=["Drainage Network"])
app.include_router(incidents_router, prefix="/api", tags=["Blockage Incidents"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(risk_router, prefix="/api", tags=["Risk Analysis"])
app.include_router(interventions_router, prefix="/api", tags=["Interventions"])
app.include_router(rainfall_router, prefix="/api", tags=["Rainfall"])
app.include_router(cleaning_router, prefix="/api", tags=["Cleaning Records"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(datasources_router, prefix="/api", tags=["Data Sources"])
app.include_router(hotspot_router, prefix="/api", tags=["Hotspot Analysis"])
app.include_router(ml_router, prefix="/api", tags=["ML Prediction"])
app.include_router(import_router, prefix="/api", tags=["Data Import"])

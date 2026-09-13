"""Remaining routers: rainfall, cleaning, import, users, hotspot, ML."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import Rainfall, CleaningRecord, User, DatasetMeta, BlockageIncident
from app.services.hotspot import compute_hotspots, compute_heatmap_points
from app.services.ml_model import train_and_predict
import csv, io

# ── Rainfall ─────────────────────────────────────────────────────────────────
rainfall_router = APIRouter()


@rainfall_router.get("/rainfall")
def get_rainfall(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    intensity: Optional[str] = None,
    session: Session = Depends(get_session),
):
    q = select(Rainfall)
    if date_from:
        q = q.where(Rainfall.record_date >= date_from)
    if date_to:
        q = q.where(Rainfall.record_date <= date_to)
    if intensity:
        q = q.where(Rainfall.intensity == intensity)
    return session.exec(q.order_by(Rainfall.record_date)).all()


# ── Cleaning ─────────────────────────────────────────────────────────────────
cleaning_router = APIRouter()


@cleaning_router.get("/cleaning")
def get_cleaning(
    drain_id: Optional[str] = None,
    session: Session = Depends(get_session),
):
    q = select(CleaningRecord)
    if drain_id:
        q = q.where(CleaningRecord.drain_id == drain_id)
    return session.exec(q.order_by(CleaningRecord.cleaning_date.desc())).all()


# ── Users ─────────────────────────────────────────────────────────────────────
users_router = APIRouter()


@users_router.get("/users")
def get_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()


# ── Data Sources ──────────────────────────────────────────────────────────────
datasources_router = APIRouter()


@datasources_router.get("/datasources")
def get_datasources(session: Session = Depends(get_session)):
    return session.exec(select(DatasetMeta)).all()


# ── Hotspot ───────────────────────────────────────────────────────────────────
hotspot_router = APIRouter()


@hotspot_router.get("/hotspots/geojson")
def hotspot_geojson(session: Session = Depends(get_session)):
    return compute_hotspots(session)


@hotspot_router.get("/hotspots/heatmap")
def heatmap_points(session: Session = Depends(get_session)):
    return compute_heatmap_points(session)


# ── ML ────────────────────────────────────────────────────────────────────────
ml_router = APIRouter()


@ml_router.get("/ml/predict/{drain_id}")
def ml_predict(drain_id: str, session: Session = Depends(get_session)):
    return train_and_predict(session, drain_id)


@ml_router.get("/ml/status")
def ml_status(session: Session = Depends(get_session)):
    from app.core.config import ML_MIN_RECORDS
    incidents = session.exec(select(BlockageIncident)).all()
    count = len(incidents)
    return {
        "records_available": count,
        "records_required": ML_MIN_RECORDS,
        "ml_available": count >= ML_MIN_RECORDS,
        "note": "ML module requires verified historical records. Demo data is flagged and may inflate apparent accuracy.",
    }


# ── Data Import ───────────────────────────────────────────────────────────────
import_router = APIRouter()

INCIDENT_REQUIRED_FIELDS = {"drain_id", "incident_date", "latitude", "longitude", "severity"}


@import_router.post("/import/incidents")
async def import_incidents(file: UploadFile = File(...), session: Session = Depends(get_session)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    errors = []
    imported = 0
    for i, row in enumerate(rows, start=2):
        row_errors = []
        for f in INCIDENT_REQUIRED_FIELDS:
            if not row.get(f):
                row_errors.append(f"Missing field: {f}")
        if row.get("latitude"):
            try:
                float(row["latitude"])
            except ValueError:
                row_errors.append("Invalid latitude")
        if row.get("longitude"):
            try:
                float(row["longitude"])
            except ValueError:
                row_errors.append("Invalid longitude")
        if row_errors:
            errors.append({"row": i, "errors": row_errors})
            continue
        existing = session.get(BlockageIncident, row.get("incident_id", f"IMP_{i}"))
        if existing:
            errors.append({"row": i, "errors": ["Duplicate incident_id"]})
            continue
        try:
            inc = BlockageIncident(
                incident_id=row.get("incident_id", f"IMP_{i}"),
                drain_id=row.get("drain_id"),
                incident_date=date.fromisoformat(row["incident_date"]),
                incident_time=row.get("incident_time"),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                blockage_type=row.get("blockage_type", "unknown"),
                plastic_present=str(row.get("plastic_present", "false")).lower() in ("true", "1", "yes"),
                plastic_type=row.get("plastic_type"),
                severity=row.get("severity", "medium"),
                rainfall_condition=row.get("rainfall_condition", "unknown"),
                waterlogging=str(row.get("waterlogging", "false")).lower() in ("true", "1", "yes"),
                source=row.get("source", "imported"),
                remarks=row.get("remarks"),
                verified=False,
            )
            session.add(inc)
            imported += 1
        except Exception as e:
            errors.append({"row": i, "errors": [str(e)]})
    session.commit()
    return {"imported": imported, "errors": errors, "total_rows": len(rows)}


@import_router.get("/import/template/incidents")
def incidents_template():
    from fastapi.responses import PlainTextResponse
    headers = "incident_id,drain_id,incident_date,incident_time,latitude,longitude,blockage_type,plastic_present,plastic_type,estimated_quantity_kg,severity,rainfall_condition,waterlogging,source,remarks"
    example = "B_NEW_001,D001,2025-06-15,17:30,9.9210,78.1150,plastic,true,bags,12.5,high,heavy,true,field_survey,Plastic bags blocking drain near market"
    return PlainTextResponse(f"{headers}\n{example}\n", media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=incidents_template.csv"})

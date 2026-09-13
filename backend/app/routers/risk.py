"""Risk scoring router and service."""
from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import RiskScore, Drain, BlockageIncident, CleaningRecord
from app.core.config import DEFAULT_RISK_WEIGHTS, RISK_LOW_MAX, RISK_MEDIUM_MAX

router = APIRouter()


def _condition_to_score(condition: str) -> float:
    """Convert drain condition to a 0-10 base score (higher = worse)."""
    return {"good": 1.0, "fair": 4.0, "poor": 7.5, "critical": 10.0, "unknown": 5.0}.get(condition, 5.0)


def _land_use_to_score(land_use: Optional[str]) -> float:
    return {
        "market": 10.0, "commercial": 8.0, "industrial": 7.0, "mixed": 6.0,
        "bus_stand": 6.0, "residential": 3.0, "school": 3.0, "open_land": 1.0,
    }.get(land_use or "residential", 4.0)


def compute_risk_for_drain(drain_id: str, session: Session, weights: dict = None) -> dict:
    if weights is None:
        weights = DEFAULT_RISK_WEIGHTS
    drain = session.get(Drain, drain_id)
    if not drain:
        return {"error": "drain not found"}

    incidents = session.exec(
        select(BlockageIncident).where(BlockageIncident.drain_id == drain_id)
    ).all()
    cleanings = session.exec(
        select(CleaningRecord).where(CleaningRecord.drain_id == drain_id)
    ).all()

    total_incidents = len(incidents)
    plastic_incidents = sum(1 for i in incidents if i.plastic_present)
    heavy_rain_incidents = sum(1 for i in incidents if i.rainfall_condition in ("heavy", "very_heavy"))

    # 1. Blockage frequency score (0-100)
    bf_score = min(total_incidents * 7.0, 100.0)  # 14+ incidents = max

    # 2. Plastic involvement score (0-100)
    ps_score = (plastic_incidents / max(total_incidents, 1)) * 100 if total_incidents > 0 else 0

    # 3. Rainfall association score (0-100)
    rs_score = (heavy_rain_incidents / max(total_incidents, 1)) * 100 if total_incidents > 0 else 0

    # 4. Drain condition score (0-100)
    cs_score = _condition_to_score(drain.condition) * 10

    # 5. Nearby activity score (0-100)
    acts_score = _land_use_to_score(drain.land_use) * 10

    # 6. Cleaning age score (0-100)
    if cleanings:
        last_clean = max(c.cleaning_date for c in cleanings)
        days_since = (date.today() - last_clean).days
        ca_score = min(days_since / 90 * 100, 100)
        days_since_int = days_since
    else:
        ca_score = 100.0  # never cleaned
        days_since_int = None

    total = (
        bf_score * weights["blockage_frequency"] +
        ps_score * weights["plastic_involvement"] +
        rs_score * weights["rainfall_association"] +
        cs_score * weights["drain_condition"] +
        acts_score * weights["nearby_activity"] +
        ca_score * weights["cleaning_age"]
    )
    total = round(min(total, 100), 1)

    if total <= RISK_LOW_MAX:
        level = "LOW"
    elif total <= RISK_MEDIUM_MAX:
        level = "MEDIUM"
    else:
        level = "HIGH"

    # Human-readable reasons
    reasons = []
    if total_incidents >= 6:
        reasons.append(f"{total_incidents} previous blockage incidents")
    if plastic_incidents >= 4:
        reasons.append(f"{plastic_incidents} plastic-related incidents")
    if heavy_rain_incidents >= 3:
        reasons.append(f"Frequently blocked during heavy rainfall ({heavy_rain_incidents} times)")
    if drain.condition in ("poor", "critical"):
        reasons.append(f"Drain condition: {drain.condition.upper()}")
    if drain.land_use in ("market", "commercial"):
        reasons.append(f"Located in high-activity {drain.land_use} area")
    if days_since_int and days_since_int > 30:
        reasons.append(f"{days_since_int} days since last cleaning")
    if not cleanings:
        reasons.append("No cleaning record found")

    return {
        "drain_id": drain_id,
        "total_score": total,
        "risk_level": level,
        "scores": {
            "blockage_frequency": round(bf_score, 1),
            "plastic_involvement": round(ps_score, 1),
            "rainfall_association": round(rs_score, 1),
            "drain_condition": round(cs_score, 1),
            "nearby_activity": round(acts_score, 1),
            "cleaning_age": round(ca_score, 1),
        },
        "weights": weights,
        "data": {
            "total_incidents": total_incidents,
            "plastic_incidents": plastic_incidents,
            "heavy_rain_incidents": heavy_rain_incidents,
            "drain_condition": drain.condition,
            "land_use": drain.land_use,
            "days_since_cleaning": days_since_int,
        },
        "reasons": reasons,
    }


@router.get("/risk/scores")
def get_risk_scores(session: Session = Depends(get_session)):
    return session.exec(select(RiskScore)).all()


@router.get("/risk/drain/{drain_id}")
def compute_drain_risk(drain_id: str, session: Session = Depends(get_session)):
    return compute_risk_for_drain(drain_id, session)


@router.get("/risk/all-computed")
def compute_all_risks(session: Session = Depends(get_session)):
    drains = session.exec(select(Drain)).all()
    results = []
    for d in drains:
        r = compute_risk_for_drain(d.drain_id, session)
        results.append(r)
    results.sort(key=lambda x: -(x.get("total_score", 0)))
    return results


@router.get("/risk/geojson")
def risk_geojson(session: Session = Depends(get_session)):
    """Risk layer as GeoJSON for Leaflet."""
    import json
    drains = session.exec(select(Drain)).all()
    features = []
    for d in drains:
        risk = compute_risk_for_drain(d.drain_id, session)
        geom = json.loads(d.geometry_json) if d.geometry_json else None
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "drain_id": d.drain_id,
                "total_score": risk.get("total_score"),
                "risk_level": risk.get("risk_level"),
                "reasons": risk.get("reasons"),
            }
        })
    return {"type": "FeatureCollection", "features": features}

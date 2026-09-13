"""Blockage incidents router."""
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import BlockageIncident

router = APIRouter()


@router.get("/incidents")
def get_incidents(
    drain_id: Optional[str] = None,
    ward_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    severity: Optional[str] = None,
    plastic_present: Optional[bool] = None,
    rainfall_condition: Optional[str] = None,
    blockage_type: Optional[str] = None,
    source: Optional[str] = None,
    session: Session = Depends(get_session),
):
    q = select(BlockageIncident)
    if drain_id:
        q = q.where(BlockageIncident.drain_id == drain_id)
    if date_from:
        q = q.where(BlockageIncident.incident_date >= date_from)
    if date_to:
        q = q.where(BlockageIncident.incident_date <= date_to)
    if severity:
        q = q.where(BlockageIncident.severity == severity)
    if plastic_present is not None:
        q = q.where(BlockageIncident.plastic_present == plastic_present)
    if rainfall_condition:
        q = q.where(BlockageIncident.rainfall_condition == rainfall_condition)
    if blockage_type:
        q = q.where(BlockageIncident.blockage_type == blockage_type)
    if source:
        q = q.where(BlockageIncident.source == source)
    q = q.order_by(BlockageIncident.incident_date.desc())
    return session.exec(q).all()


@router.get("/incidents/geojson")
def incidents_geojson(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    plastic_present: Optional[bool] = None,
    severity: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """GeoJSON point layer for Leaflet."""
    q = select(BlockageIncident)
    if date_from:
        q = q.where(BlockageIncident.incident_date >= date_from)
    if date_to:
        q = q.where(BlockageIncident.incident_date <= date_to)
    if plastic_present is not None:
        q = q.where(BlockageIncident.plastic_present == plastic_present)
    if severity:
        q = q.where(BlockageIncident.severity == severity)
    incidents = session.exec(q).all()
    features = []
    for i in incidents:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [i.longitude, i.latitude]},
            "properties": {
                "incident_id": i.incident_id,
                "drain_id": i.drain_id,
                "incident_date": str(i.incident_date),
                "incident_time": i.incident_time,
                "blockage_type": i.blockage_type,
                "plastic_present": i.plastic_present,
                "plastic_type": i.plastic_type,
                "severity": i.severity,
                "rainfall_condition": i.rainfall_condition,
                "waterlogging": i.waterlogging,
                "source": i.source,
                "verified": i.verified,
            }
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str, session: Session = Depends(get_session)):
    return session.get(BlockageIncident, incident_id)


@router.post("/incidents")
def create_incident(incident: BlockageIncident, session: Session = Depends(get_session)):
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident


@router.put("/incidents/{incident_id}")
def update_incident(incident_id: str, data: dict, session: Session = Depends(get_session)):
    incident = session.get(BlockageIncident, incident_id)
    if not incident:
        return {"error": "not found"}
    for k, v in data.items():
        setattr(incident, k, v)
    session.add(incident)
    session.commit()
    return incident

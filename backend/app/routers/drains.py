"""Drains + Junctions + Wards routers."""
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import Drain, Junction, Ward

router = APIRouter()


@router.get("/wards")
def get_wards(session: Session = Depends(get_session)):
    return session.exec(select(Ward)).all()


@router.get("/junctions")
def get_junctions(ward_id: Optional[int] = None, session: Session = Depends(get_session)):
    q = select(Junction)
    if ward_id:
        q = q.where(Junction.ward_id == ward_id)
    return session.exec(q).all()


@router.get("/drains")
def get_drains(
    ward_id: Optional[int] = None,
    condition: Optional[str] = None,
    drain_type: Optional[str] = None,
    land_use: Optional[str] = None,
    session: Session = Depends(get_session),
):
    q = select(Drain)
    if ward_id:
        q = q.where(Drain.ward_id == ward_id)
    if condition:
        q = q.where(Drain.condition == condition)
    if drain_type:
        q = q.where(Drain.drain_type == drain_type)
    if land_use:
        q = q.where(Drain.land_use == land_use)
    drains = session.exec(q).all()
    return drains


@router.get("/drains/{drain_id}")
def get_drain(drain_id: str, session: Session = Depends(get_session)):
    drain = session.get(Drain, drain_id)
    return drain


@router.get("/drains/geojson/all")
def drains_geojson(session: Session = Depends(get_session)):
    """Return drains as a GeoJSON FeatureCollection for Leaflet."""
    drains = session.exec(select(Drain)).all()
    features = []
    for d in drains:
        geom = json.loads(d.geometry_json) if d.geometry_json else None
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "drain_id": d.drain_id,
                "drain_type": d.drain_type,
                "condition": d.condition,
                "length_m": d.length_m,
                "width_m": d.width_m,
                "material": d.material,
                "ward_id": d.ward_id,
                "land_use": d.land_use,
                "status": d.status,
                "source": d.source,
                "verified": d.verified,
            }
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/wards/geojson/all")
def wards_geojson(session: Session = Depends(get_session)):
    wards = session.exec(select(Ward)).all()
    features = []
    for w in wards:
        geom = json.loads(w.geometry_json) if w.geometry_json else None
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "ward_id": w.ward_id,
                "name": w.name,
                "area_sqkm": w.area_sqkm,
                "population": w.population,
                "source": w.source,
                "verified": w.verified,
            }
        })
    return {"type": "FeatureCollection", "features": features}

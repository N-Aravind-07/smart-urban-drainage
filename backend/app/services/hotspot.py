"""Hotspot analysis service."""
from collections import defaultdict
from typing import List, Dict, Any
from sqlmodel import Session, select
from app.db.models import BlockageIncident, Drain
import json


def compute_hotspots(session: Session) -> Dict[str, Any]:
    """
    Frequency-based hotspot analysis per drain segment.
    Returns GeoJSON FeatureCollection with LOW/MEDIUM/HIGH classification.
    """
    incidents = session.exec(select(BlockageIncident)).all()
    drains = {d.drain_id: d for d in session.exec(select(Drain)).all()}

    drain_counts = defaultdict(lambda: {"total": 0, "plastic": 0, "heavy_rain": 0})
    for inc in incidents:
        if inc.drain_id:
            drain_counts[inc.drain_id]["total"] += 1
            if inc.plastic_present:
                drain_counts[inc.drain_id]["plastic"] += 1
            if inc.rainfall_condition in ("heavy", "very_heavy"):
                drain_counts[inc.drain_id]["heavy_rain"] += 1

    max_count = max((v["total"] for v in drain_counts.values()), default=1)

    def classify(count):
        if count == 0:
            return "NONE"
        pct = count / max_count
        if pct >= 0.6:
            return "HIGH"
        elif pct >= 0.3:
            return "MEDIUM"
        else:
            return "LOW"

    features = []
    for drain_id, drain in drains.items():
        counts = drain_counts[drain_id]
        level = classify(counts["total"])
        geom = json.loads(drain.geometry_json) if drain.geometry_json else None
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "drain_id": drain_id,
                "hotspot_level": level,
                "total_incidents": counts["total"],
                "plastic_incidents": counts["plastic"],
                "heavy_rain_incidents": counts["heavy_rain"],
            }
        })

    return {"type": "FeatureCollection", "features": features}


def compute_heatmap_points(session: Session) -> List[Dict]:
    """
    Return weighted lat/lng points for Leaflet.heat heatmap layer.
    """
    incidents = session.exec(select(BlockageIncident)).all()
    severity_weight = {"low": 0.3, "medium": 0.5, "high": 0.8, "critical": 1.0}
    points = []
    for inc in incidents:
        w = severity_weight.get(inc.severity, 0.5)
        if inc.plastic_present:
            w = min(w + 0.2, 1.0)
        points.append({
            "lat": inc.latitude,
            "lng": inc.longitude,
            "weight": w,
        })
    return points

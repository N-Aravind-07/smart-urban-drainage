"""Analytics router — all chart data endpoints."""
from collections import defaultdict
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.db.models import BlockageIncident, Drain, CleaningRecord, RiskScore

router = APIRouter()


@router.get("/analytics/summary")
def summary(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    drains = session.exec(select(Drain)).all()
    risk_scores = session.exec(select(RiskScore)).all()
    cleaning = session.exec(select(CleaningRecord)).all()

    total_length = sum(d.length_m or 0 for d in drains) / 1000  # km
    plastic_count = sum(1 for i in incidents if i.plastic_present)
    high_risk = sum(1 for r in risk_scores if r.risk_level == "HIGH")
    open_tasks = 0  # from interventions

    return {
        "total_drain_length_km": round(total_length, 2),
        "total_drain_points": len(drains),
        "total_incidents": len(incidents),
        "plastic_incidents": plastic_count,
        "high_risk_drains": high_risk,
        "completed_cleanings": len(cleaning),
        "wards_covered": 4,
        "open_interventions": 2,
    }


@router.get("/analytics/monthly-trend")
def monthly_trend(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    monthly = defaultdict(lambda: {"total": 0, "plastic": 0})
    for i in incidents:
        key = f"{i.incident_date.year}-{i.incident_date.month:02d}"
        monthly[key]["total"] += 1
        if i.plastic_present:
            monthly[key]["plastic"] += 1
    result = [{"month": k, "total": v["total"], "plastic": v["plastic"]}
              for k, v in sorted(monthly.items())]
    return result


@router.get("/analytics/yearly-trend")
def yearly_trend(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    yearly = defaultdict(lambda: {"total": 0, "plastic": 0})
    for i in incidents:
        yr = str(i.incident_date.year)
        yearly[yr]["total"] += 1
        if i.plastic_present:
            yearly[yr]["plastic"] += 1
    return [{"year": k, "total": v["total"], "plastic": v["plastic"]}
            for k, v in sorted(yearly.items())]


@router.get("/analytics/plastic-breakdown")
def plastic_breakdown(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    counts = defaultdict(int)
    for i in incidents:
        if i.plastic_present and i.plastic_type:
            counts[i.plastic_type] += 1
    plastic_total = sum(1 for i in incidents if i.plastic_present)
    non_plastic = sum(1 for i in incidents if not i.plastic_present)
    return {
        "plastic_types": [{"type": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])],
        "plastic_total": plastic_total,
        "non_plastic": non_plastic,
        "total": len(incidents),
    }


@router.get("/analytics/rainfall-blockage")
def rainfall_blockage(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    rain_map = defaultdict(lambda: {"total": 0, "plastic": 0})
    order = ["none", "light", "moderate", "heavy", "very_heavy"]
    for i in incidents:
        rain_map[i.rainfall_condition]["total"] += 1
        if i.plastic_present:
            rain_map[i.rainfall_condition]["plastic"] += 1
    return [
        {"rainfall": r, "total": rain_map[r]["total"], "plastic": rain_map[r]["plastic"]}
        for r in order
    ]


@router.get("/analytics/top-drains")
def top_drains(limit: int = 10, session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    drain_counts = defaultdict(lambda: {"total": 0, "plastic": 0})
    for i in incidents:
        if i.drain_id:
            drain_counts[i.drain_id]["total"] += 1
            if i.plastic_present:
                drain_counts[i.drain_id]["plastic"] += 1
    sorted_drains = sorted(drain_counts.items(), key=lambda x: -x[1]["total"])[:limit]
    return [{"drain_id": k, "total": v["total"], "plastic": v["plastic"]}
            for k, v in sorted_drains]


@router.get("/analytics/time-of-day")
def time_of_day(session: Session = Depends(get_session)):
    """Only uses incidents that have time data. Explicitly flagged."""
    incidents = session.exec(select(BlockageIncident)).all()
    with_time = [i for i in incidents if i.incident_time]
    slots = {"00-06": 0, "06-12": 0, "12-18": 0, "18-24": 0}
    for i in with_time:
        try:
            h = int(i.incident_time.split(":")[0])
            if h < 6:
                slots["00-06"] += 1
            elif h < 12:
                slots["06-12"] += 1
            elif h < 18:
                slots["12-18"] += 1
            else:
                slots["18-24"] += 1
        except Exception:
            pass
    return {
        "data": [{"slot": k, "count": v} for k, v in slots.items()],
        "records_with_time": len(with_time),
        "records_without_time": len(incidents) - len(with_time),
        "note": "Time-of-day analysis only uses records where time was recorded. Records without time are excluded."
    }


@router.get("/analytics/severity-distribution")
def severity_distribution(session: Session = Depends(get_session)):
    incidents = session.exec(select(BlockageIncident)).all()
    counts = defaultdict(int)
    for i in incidents:
        counts[i.severity] += 1
    return [{"severity": k, "count": v} for k, v in counts.items()]


@router.get("/analytics/ward-breakdown")
def ward_breakdown(session: Session = Depends(get_session)):
    """Incidents per ward (joined via drain table)."""
    incidents = session.exec(select(BlockageIncident)).all()
    drains = {d.drain_id: d.ward_id for d in session.exec(select(Drain)).all()}
    ward_counts = defaultdict(lambda: {"total": 0, "plastic": 0})
    for i in incidents:
        ward = drains.get(i.drain_id, "Unknown") if i.drain_id else "Unknown"
        ward_counts[str(ward)]["total"] += 1
        if i.plastic_present:
            ward_counts[str(ward)]["plastic"] += 1
    return [{"ward_id": k, "total": v["total"], "plastic": v["plastic"]}
            for k, v in sorted(ward_counts.items())]

"""Interventions router."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.db.models import Intervention

router = APIRouter()

VALID_STATUSES = ["OPEN", "ASSIGNED", "INSPECTED", "CLEANING_SCHEDULED", "CLEANED", "VERIFIED", "CLOSED"]


@router.get("/interventions")
def get_interventions(
    drain_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    session: Session = Depends(get_session),
):
    q = select(Intervention)
    if drain_id:
        q = q.where(Intervention.drain_id == drain_id)
    if status:
        q = q.where(Intervention.status == status)
    if priority:
        q = q.where(Intervention.priority == priority)
    return session.exec(q).all()


@router.get("/interventions/{intervention_id}")
def get_intervention(intervention_id: str, session: Session = Depends(get_session)):
    return session.get(Intervention, intervention_id)


@router.post("/interventions")
def create_intervention(intervention: Intervention, session: Session = Depends(get_session)):
    session.add(intervention)
    session.commit()
    session.refresh(intervention)
    return intervention


@router.patch("/interventions/{intervention_id}/status")
def update_status(intervention_id: str, body: dict, session: Session = Depends(get_session)):
    interv = session.get(Intervention, intervention_id)
    if not interv:
        return {"error": "not found"}
    new_status = body.get("status")
    if new_status not in VALID_STATUSES:
        return {"error": f"invalid status. Must be one of {VALID_STATUSES}"}
    interv.status = new_status
    if new_status == "CLEANED":
        interv.completed_date = date.today()
    if "notes" in body:
        interv.notes = body["notes"]
    if "after_incident_count" in body:
        interv.after_incident_count = body["after_incident_count"]
    session.add(interv)
    session.commit()
    return interv


@router.get("/interventions/{intervention_id}/before-after")
def before_after(intervention_id: str, session: Session = Depends(get_session)):
    interv = session.get(Intervention, intervention_id)
    if not interv:
        return {"error": "not found"}
    before = interv.before_incident_count
    after = interv.after_incident_count
    reduction = None
    if before and after is not None:
        reduction = round((before - after) / before * 100, 1) if before > 0 else 0
    return {
        "intervention_id": intervention_id,
        "drain_id": interv.drain_id,
        "before_incident_count": before,
        "after_incident_count": after,
        "reduction_percent": reduction,
        "status": interv.status,
        "note": "Before/after counts are based on available demo data. Verify with real records.",
    }

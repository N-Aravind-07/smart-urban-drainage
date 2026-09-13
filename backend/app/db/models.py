"""Database models using SQLModel (SQLAlchemy + Pydantic)."""
from typing import Optional
from datetime import datetime, date
from sqlmodel import Field, SQLModel


class Ward(SQLModel, table=True):
    __tablename__ = "wards"
    ward_id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    geometry_json: Optional[str] = None  # GeoJSON polygon string
    area_sqkm: Optional[float] = None
    population: Optional[int] = None
    source: str = "DEMO/SIMULATED"
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Junction(SQLModel, table=True):
    __tablename__ = "junctions"
    junction_id: str = Field(primary_key=True)
    latitude: float
    longitude: float
    junction_type: str  # manhole, outlet, inlet
    ward_id: Optional[int] = None
    condition: Optional[str] = None  # good, fair, poor
    source: str = "DEMO/SIMULATED"
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Drain(SQLModel, table=True):
    __tablename__ = "drains"
    drain_id: str = Field(primary_key=True)
    geometry_json: str  # GeoJSON LineString
    drain_type: str  # stormwater, combined, roadside
    length_m: Optional[float] = None
    width_m: Optional[float] = None
    depth_m: Optional[float] = None
    material: Optional[str] = None  # concrete, brick, RCC, earthen
    condition: str = "unknown"  # good, fair, poor, critical, unknown
    ward_id: Optional[int] = None
    from_junction: Optional[str] = None
    to_junction: Optional[str] = None
    land_use: Optional[str] = None  # residential, commercial, market, industrial, mixed
    status: str = "active"
    source: str = "DEMO/SIMULATED"
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BlockageIncident(SQLModel, table=True):
    __tablename__ = "blockage_incidents"
    incident_id: str = Field(primary_key=True)
    drain_id: Optional[str] = None
    incident_date: date
    incident_time: Optional[str] = None  # HH:MM string (nullable — not all records have time)
    latitude: float
    longitude: float
    blockage_type: str  # plastic, solid_waste, silt, vegetation, mixed, unknown
    plastic_present: bool = False
    plastic_type: Optional[str] = None  # bags, bottles, packaging, mixed_plastic, unknown
    estimated_quantity_kg: Optional[float] = None
    severity: str  # low, medium, high, critical
    rainfall_condition: str  # none, light, moderate, heavy, very_heavy
    waterlogging: bool = False
    duration_hours: Optional[float] = None
    cleaning_date: Optional[date] = None
    cleaning_method: Optional[str] = None
    source: str = "DEMO/SIMULATED"
    photo_url: Optional[str] = None
    remarks: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CleaningRecord(SQLModel, table=True):
    __tablename__ = "cleaning_records"
    cleaning_id: str = Field(primary_key=True)
    drain_id: str
    cleaning_date: date
    method: str  # manual, mechanical, jetting, combined
    plastic_removed_kg: Optional[float] = None
    total_waste_kg: Optional[float] = None
    worker_agency: Optional[str] = None
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None
    remarks: Optional[str] = None
    source: str = "DEMO/SIMULATED"
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Rainfall(SQLModel, table=True):
    __tablename__ = "rainfall"
    rainfall_id: Optional[int] = Field(default=None, primary_key=True)
    record_date: date
    record_time: Optional[str] = None
    ward_id: Optional[int] = None
    location_name: Optional[str] = None
    rainfall_mm: float
    intensity: str  # none, light, moderate, heavy, very_heavy
    source: str = "DEMO/SIMULATED"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RiskScore(SQLModel, table=True):
    __tablename__ = "risk_scores"
    risk_id: Optional[int] = Field(default=None, primary_key=True)
    drain_id: str
    calculation_date: date
    blockage_frequency_score: float = 0.0
    plastic_score: float = 0.0
    rainfall_score: float = 0.0
    condition_score: float = 0.0
    activity_score: float = 0.0
    cleaning_age_score: float = 0.0
    total_score: float = 0.0
    risk_level: str  # LOW, MEDIUM, HIGH
    days_since_cleaning: Optional[int] = None
    incident_count_total: int = 0
    incident_count_plastic: int = 0
    incident_count_heavy_rain: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Intervention(SQLModel, table=True):
    __tablename__ = "interventions"
    intervention_id: str = Field(primary_key=True)
    drain_id: str
    recommended_action: str  # immediate_inspection, preventive_cleaning, monitor, no_action
    priority: str  # HIGH, MEDIUM, LOW
    status: str = "OPEN"  # OPEN, ASSIGNED, INSPECTED, CLEANING_SCHEDULED, CLEANED, VERIFIED, CLOSED
    assigned_to: Optional[str] = None
    created_date: date = Field(default_factory=date.today)
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    notes: Optional[str] = None
    before_incident_count: Optional[int] = None
    after_incident_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    role: str  # admin, officer, field_worker
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DatasetMeta(SQLModel, table=True):
    __tablename__ = "dataset_meta"
    meta_id: Optional[int] = Field(default=None, primary_key=True)
    dataset_name: str
    source_category: str  # municipal, government_gis, punal, osm, rainfall, field_survey, news, demo
    source_url: Optional[str] = None
    collection_date: Optional[date] = None
    record_count: int = 0
    verification_status: str  # verified, unverified, partial, demo
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

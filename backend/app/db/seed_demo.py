"""
Demo data seeder for Madurai study area.
EVERY record carries source='DEMO/SIMULATED' and verified=False.
This file must NEVER be used to represent real infrastructure.
"""
import json
import random
from datetime import date, timedelta
from sqlmodel import Session, select
from app.db.database import engine
from app.db.models import (
    Ward, Junction, Drain, BlockageIncident, CleaningRecord,
    Rainfall, RiskScore, Intervention, User, DatasetMeta
)

# ── Madurai approximate centre: 9.9252° N, 78.1198° E ──────────────────────
# Study area: ~2km radius around Goripalayam / Tallakulam area


def _poly(coords):
    return json.dumps({"type": "Polygon", "coordinates": [coords]})


def _line(coords):
    return json.dumps({"type": "LineString", "coordinates": coords})


WARDS = [
    {
        "name": "Ward 1 — Goripalayam (Demo)",
        "geometry_json": _poly([
            [78.112, 9.918], [78.124, 9.918], [78.124, 9.926], [78.112, 9.926], [78.112, 9.918]
        ]),
        "area_sqkm": 1.2, "population": 18000,
    },
    {
        "name": "Ward 2 — Tallakulam (Demo)",
        "geometry_json": _poly([
            [78.124, 9.918], [78.136, 9.918], [78.136, 9.926], [78.124, 9.926], [78.124, 9.918]
        ]),
        "area_sqkm": 1.1, "population": 21000,
    },
    {
        "name": "Ward 3 — Arasaradi (Demo)",
        "geometry_json": _poly([
            [78.112, 9.926], [78.124, 9.926], [78.124, 9.934], [78.112, 9.934], [78.112, 9.926]
        ]),
        "area_sqkm": 1.3, "population": 16000,
    },
    {
        "name": "Ward 4 — KK Nagar (Demo)",
        "geometry_json": _poly([
            [78.124, 9.926], [78.136, 9.926], [78.136, 9.934], [78.124, 9.934], [78.124, 9.926]
        ]),
        "area_sqkm": 1.4, "population": 24000,
    },
]

# Junctions: (id, lat, lng, type, ward_id)
JUNCTIONS_DATA = [
    # Ward 1 — Goripalayam
    ("J01", 9.9195, 78.1130, "manhole",  1),
    ("J02", 9.9210, 78.1150, "manhole",  1),
    ("J03", 9.9225, 78.1170, "manhole",  1),
    ("J04", 9.9210, 78.1190, "junction", 1),
    ("J05", 9.9190, 78.1210, "outlet",   1),
    ("J06", 9.9230, 78.1130, "manhole",  1),
    ("J07", 9.9240, 78.1155, "manhole",  1),
    ("J08", 9.9250, 78.1180, "junction", 1),
    # Ward 2 — Tallakulam
    ("J09", 9.9195, 78.1255, "manhole",  2),
    ("J10", 9.9210, 78.1270, "manhole",  2),
    ("J11", 9.9225, 78.1290, "junction", 2),
    ("J12", 9.9205, 78.1315, "outlet",   2),
    ("J13", 9.9240, 78.1260, "manhole",  2),
    ("J14", 9.9250, 78.1285, "manhole",  2),
    # Ward 3 — Arasaradi
    ("J15", 9.9295, 78.1135, "manhole",  3),
    ("J16", 9.9310, 78.1155, "manhole",  3),
    ("J17", 9.9325, 78.1175, "junction", 3),
    ("J18", 9.9300, 78.1200, "outlet",   3),
    ("J19", 9.9315, 78.1220, "manhole",  3),
    ("J20", 9.9330, 78.1140, "manhole",  3),
    # Ward 4 — KK Nagar
    ("J21", 9.9295, 78.1260, "manhole",  4),
    ("J22", 9.9310, 78.1280, "junction", 4),
    ("J23", 9.9325, 78.1300, "manhole",  4),
    ("J24", 9.9305, 78.1320, "outlet",   4),
    ("J25", 9.9335, 78.1265, "manhole",  4),
    ("J26", 9.9345, 78.1290, "junction", 4),
    # Cross-ward connectors
    ("J27", 9.9225, 78.1225, "junction", 1),
    ("J28", 9.9270, 78.1210, "junction", 3),
    ("J29", 9.9260, 78.1310, "junction", 4),
    ("J30", 9.9280, 78.1175, "outlet",   3),
]

# Drain segments: (id, from_j, to_j, type, length, width, depth, material, condition, ward_id, land_use)
DRAINS_DATA = [
    # Ward 1 — Goripalayam (high-risk area, near market)
    ("D001", "J01", "J02", "stormwater",  145, 0.9, 0.8, "concrete", "fair",     1, "commercial"),
    ("D002", "J02", "J03", "stormwater",  160, 0.9, 0.8, "concrete", "poor",     1, "market"),
    ("D003", "J03", "J04", "combined",    200, 1.2, 1.0, "RCC",      "poor",     1, "market"),
    ("D004", "J04", "J05", "stormwater",  180, 1.0, 0.9, "concrete", "critical", 1, "commercial"),
    ("D005", "J06", "J07", "roadside",    120, 0.6, 0.5, "brick",    "fair",     1, "residential"),
    ("D006", "J07", "J08", "stormwater",  135, 0.8, 0.7, "concrete", "fair",     1, "residential"),
    ("D007", "J08", "J04", "combined",    170, 1.1, 0.9, "RCC",      "poor",     1, "mixed"),
    # Ward 2 — Tallakulam
    ("D008", "J09", "J10", "stormwater",  155, 0.8, 0.7, "concrete", "good",     2, "residential"),
    ("D009", "J10", "J11", "stormwater",  140, 0.8, 0.7, "concrete", "fair",     2, "residential"),
    ("D010", "J11", "J12", "combined",    195, 1.2, 1.0, "RCC",      "poor",     2, "commercial"),
    ("D011", "J13", "J14", "roadside",    125, 0.6, 0.5, "brick",    "fair",     2, "residential"),
    ("D012", "J14", "J11", "stormwater",  165, 0.9, 0.8, "concrete", "fair",     2, "mixed"),
    # Ward 3 — Arasaradi
    ("D013", "J15", "J16", "stormwater",  150, 0.8, 0.7, "concrete", "good",     3, "residential"),
    ("D014", "J16", "J17", "stormwater",  145, 0.8, 0.7, "concrete", "good",     3, "residential"),
    ("D015", "J17", "J18", "combined",    185, 1.1, 0.9, "RCC",      "fair",     3, "mixed"),
    ("D016", "J19", "J17", "stormwater",  130, 0.7, 0.6, "concrete", "fair",     3, "residential"),
    ("D017", "J20", "J15", "roadside",    110, 0.6, 0.5, "earthen",  "poor",     3, "open_land"),
    # Ward 4 — KK Nagar
    ("D018", "J21", "J22", "stormwater",  160, 0.9, 0.8, "concrete", "fair",     4, "commercial"),
    ("D019", "J22", "J23", "combined",    175, 1.2, 1.0, "RCC",      "poor",     4, "market"),
    ("D020", "J23", "J24", "stormwater",  190, 1.0, 0.9, "concrete", "critical", 4, "market"),
    ("D021", "J25", "J26", "stormwater",  140, 0.8, 0.7, "concrete", "fair",     4, "commercial"),
    ("D022", "J26", "J22", "combined",    155, 1.1, 0.9, "RCC",      "poor",     4, "mixed"),
    # Cross-ward / trunk drains
    ("D023", "J27", "J28", "combined",    310, 1.5, 1.2, "RCC",      "fair",     1, "mixed"),
    ("D024", "J28", "J30", "combined",    280, 1.5, 1.2, "RCC",      "good",     3, "residential"),
    ("D025", "J29", "J24", "stormwater",  220, 1.0, 0.8, "concrete", "poor",     4, "commercial"),
    ("D026", "J04", "J27", "stormwater",  175, 1.0, 0.8, "concrete", "fair",     1, "mixed"),
    ("D027", "J11", "J29", "combined",    240, 1.3, 1.1, "RCC",      "poor",     2, "commercial"),  # worst drain
    ("D028", "J22", "J29", "combined",    210, 1.3, 1.1, "RCC",      "poor",     4, "market"),
    ("D029", "J08", "J27", "stormwater",  165, 0.9, 0.8, "concrete", "fair",     1, "residential"),
    ("D030", "J26", "J29", "stormwater",  195, 1.0, 0.9, "concrete", "fair",     4, "commercial"),
]

# ── Geometry helpers ─────────────────────────────────────────────────────────
def _junc_coords(junctions_dict, jid):
    j = junctions_dict.get(jid)
    return [j["lng"], j["lat"]] if j else [78.12, 9.92]


def _midpoint(a, b):
    return [(a[0]+b[0])/2, (a[1]+b[1])/2]


# ── Blockage incident generator ──────────────────────────────────────────────
def _generate_incidents(junctions_dict):
    """Generate 80 realistic demo blockage incidents."""
    random.seed(42)

    # High-frequency drains (near market areas)
    hotspot_drains = {
        "D002": {"plastic_prob": 0.90, "severity_weights": [0.05, 0.25, 0.50, 0.20]},
        "D003": {"plastic_prob": 0.85, "severity_weights": [0.05, 0.20, 0.50, 0.25]},
        "D004": {"plastic_prob": 0.88, "severity_weights": [0.05, 0.15, 0.45, 0.35]},
        "D027": {"plastic_prob": 0.92, "severity_weights": [0.02, 0.15, 0.45, 0.38]},  # worst
        "D010": {"plastic_prob": 0.80, "severity_weights": [0.05, 0.25, 0.50, 0.20]},
        "D019": {"plastic_prob": 0.82, "severity_weights": [0.05, 0.20, 0.50, 0.25]},
        "D020": {"plastic_prob": 0.85, "severity_weights": [0.02, 0.15, 0.45, 0.38]},
        "D028": {"plastic_prob": 0.75, "severity_weights": [0.10, 0.30, 0.40, 0.20]},
    }
    medium_drains = ["D001", "D007", "D009", "D011", "D012", "D017", "D018", "D021", "D022", "D023"]
    low_drains = ["D005", "D006", "D008", "D013", "D014", "D015", "D016", "D024", "D025", "D029", "D030"]

    # Drain coordinates lookup (use midpoint of from/to junction)
    drain_coords = {}
    for d in DRAINS_DATA:
        did, fj, tj = d[0], d[1], d[2]
        fa = _junc_coords(junctions_dict, fj)
        ta = _junc_coords(junctions_dict, tj)
        mx = (fa[0] + ta[0]) / 2 + random.uniform(-0.0003, 0.0003)
        my = (fa[1] + ta[1]) / 2 + random.uniform(-0.0003, 0.0003)
        drain_coords[did] = (my, mx)  # lat, lng

    plastic_types = ["bags", "bottles", "packaging", "mixed_plastic", "bags"]
    rain_map = {
        "heavy": "heavy", "very_heavy": "very_heavy", "moderate": "moderate",
        "light": "light", "none": "none"
    }

    # Monsoon months get heavy rain bias
    def rain_for_month(m):
        if m in [6, 7, 8, 9, 10, 11]:
            return random.choices(
                ["none", "light", "moderate", "heavy", "very_heavy"],
                weights=[0.05, 0.15, 0.25, 0.35, 0.20]
            )[0]
        else:
            return random.choices(
                ["none", "light", "moderate", "heavy", "very_heavy"],
                weights=[0.40, 0.25, 0.20, 0.10, 0.05]
            )[0]

    incidents = []
    count = 0
    target = 80

    # Hotspot drains: ~45 incidents total
    for drain_id, props in hotspot_drains.items():
        n = random.randint(5, 10)
        for _ in range(n):
            if count >= target:
                break
            yr = random.choice([2023, 2023, 2024, 2024, 2025])
            mo = random.randint(1, 12)
            dy = random.randint(1, 28)
            rain = rain_for_month(mo)
            waterlog = rain in ("heavy", "very_heavy") and random.random() < 0.8
            plastic = random.random() < props["plastic_prob"]
            severity = random.choices(["low", "medium", "high", "critical"],
                                      weights=props["severity_weights"])[0]
            lat, lng = drain_coords.get(drain_id, (9.922, 78.118))
            lat += random.uniform(-0.0002, 0.0002)
            lng += random.uniform(-0.0002, 0.0002)
            iid = f"B{count+1:03d}"
            cleaning_days = random.randint(1, 14) if severity in ("high", "critical") else random.randint(3, 30)
            inc_date = date(yr, mo, dy)
            clean_date = inc_date + timedelta(days=cleaning_days) if random.random() < 0.80 else None
            # Time is only present 60% of the time (realistic for manual records)
            has_time = random.random() < 0.60
            incident_time = f"{random.randint(6,22):02d}:{random.choice(['00','15','30','45'])}" if has_time else None

            incidents.append({
                "incident_id": iid,
                "drain_id": drain_id,
                "incident_date": inc_date,
                "incident_time": incident_time,
                "latitude": lat,
                "longitude": lng,
                "blockage_type": "plastic" if plastic else random.choice(["solid_waste", "silt", "mixed"]),
                "plastic_present": plastic,
                "plastic_type": random.choice(plastic_types) if plastic else None,
                "estimated_quantity_kg": round(random.uniform(5, 40), 1) if plastic else round(random.uniform(10, 60), 1),
                "severity": severity,
                "rainfall_condition": rain,
                "waterlogging": waterlog,
                "duration_hours": round(random.uniform(1, 8), 1),
                "cleaning_date": clean_date,
                "cleaning_method": random.choice(["manual", "mechanical", "jetting"]) if clean_date else None,
                "source": "DEMO/SIMULATED",
                "verified": False,
                "remarks": f"Demo incident at {drain_id}. NOT a real record.",
            })
            count += 1

    # Medium drains: ~25 incidents
    for drain_id in medium_drains:
        if count >= target:
            break
        n = random.randint(2, 4)
        for _ in range(n):
            if count >= target:
                break
            yr = random.choice([2023, 2024, 2025])
            mo = random.randint(1, 12)
            dy = random.randint(1, 28)
            rain = rain_for_month(mo)
            plastic = random.random() < 0.55
            severity = random.choices(["low", "medium", "high"], weights=[0.3, 0.5, 0.2])[0]
            lat, lng = drain_coords.get(drain_id, (9.922, 78.118))
            lat += random.uniform(-0.0002, 0.0002)
            lng += random.uniform(-0.0002, 0.0002)
            iid = f"B{count+1:03d}"
            inc_date = date(yr, mo, dy)
            clean_date = inc_date + timedelta(days=random.randint(3, 21)) if random.random() < 0.75 else None
            has_time = random.random() < 0.55
            incident_time = f"{random.randint(6,22):02d}:{random.choice(['00','15','30','45'])}" if has_time else None

            incidents.append({
                "incident_id": iid,
                "drain_id": drain_id,
                "incident_date": inc_date,
                "incident_time": incident_time,
                "latitude": lat,
                "longitude": lng,
                "blockage_type": "plastic" if plastic else random.choice(["solid_waste", "silt", "vegetation"]),
                "plastic_present": plastic,
                "plastic_type": random.choice(plastic_types) if plastic else None,
                "estimated_quantity_kg": round(random.uniform(3, 25), 1),
                "severity": severity,
                "rainfall_condition": rain,
                "waterlogging": rain in ("heavy", "very_heavy") and random.random() < 0.5,
                "duration_hours": round(random.uniform(0.5, 5), 1),
                "cleaning_date": clean_date,
                "cleaning_method": random.choice(["manual", "mechanical"]) if clean_date else None,
                "source": "DEMO/SIMULATED",
                "verified": False,
                "remarks": f"Demo incident at {drain_id}. NOT a real record.",
            })
            count += 1

    # Fill remaining to 80 from low drains
    li = 0
    while count < target and li < len(low_drains):
        drain_id = low_drains[li % len(low_drains)]
        yr = random.choice([2023, 2024, 2025])
        mo = random.randint(4, 11)
        dy = random.randint(1, 28)
        rain = rain_for_month(mo)
        plastic = random.random() < 0.30
        lat, lng = drain_coords.get(drain_id, (9.922, 78.118))
        lat += random.uniform(-0.0002, 0.0002)
        lng += random.uniform(-0.0002, 0.0002)
        iid = f"B{count+1:03d}"
        inc_date = date(yr, mo, dy)
        incidents.append({
            "incident_id": iid,
            "drain_id": drain_id,
            "incident_date": inc_date,
            "incident_time": None,
            "latitude": lat,
            "longitude": lng,
            "blockage_type": "plastic" if plastic else "silt",
            "plastic_present": plastic,
            "plastic_type": random.choice(plastic_types) if plastic else None,
            "estimated_quantity_kg": round(random.uniform(2, 15), 1),
            "severity": "low",
            "rainfall_condition": rain,
            "waterlogging": False,
            "duration_hours": round(random.uniform(0.5, 2), 1),
            "cleaning_date": inc_date + timedelta(days=random.randint(7, 45)),
            "cleaning_method": "manual",
            "source": "DEMO/SIMULATED",
            "verified": False,
            "remarks": f"Demo incident at {drain_id}. NOT a real record.",
        })
        count += 1
        li += 1

    return incidents


def _generate_rainfall():
    """Generate 730 daily rainfall records (2 years) for Madurai pattern."""
    random.seed(99)
    records = []
    start = date(2023, 1, 1)
    for i in range(730):
        d = start + timedelta(days=i)
        m = d.month
        # Madurai: NE monsoon Oct-Dec, SW Jun-Sep, dry Jan-May
        if m in [10, 11, 12]:
            mm = random.choices([0, random.uniform(0.1,5), random.uniform(5,20),
                                  random.uniform(20,60), random.uniform(60,120)],
                                 weights=[0.15, 0.20, 0.25, 0.25, 0.15])[0]
        elif m in [6, 7, 8, 9]:
            mm = random.choices([0, random.uniform(0.1,5), random.uniform(5,20),
                                  random.uniform(20,50)],
                                 weights=[0.30, 0.25, 0.30, 0.15])[0]
        else:
            mm = random.choices([0, random.uniform(0.1,3), random.uniform(3,10)],
                                 weights=[0.65, 0.25, 0.10])[0]

        if mm == 0:
            intensity = "none"
        elif mm < 5:
            intensity = "light"
        elif mm < 20:
            intensity = "moderate"
        elif mm < 60:
            intensity = "heavy"
        else:
            intensity = "very_heavy"

        records.append({
            "record_date": d,
            "record_time": None,
            "ward_id": None,
            "location_name": "Madurai (Demo Station)",
            "rainfall_mm": round(mm, 1),
            "intensity": intensity,
            "source": "DEMO/SIMULATED",
        })
    return records


def seed(force: bool = False):
    """Seed demo data. Skip if data already exists."""
    with Session(engine) as session:
        existing = session.exec(select(Ward)).first()
        if existing and not force:
            print("Demo data already present. Skipping seed.")
            return

        print("Seeding DEMO data for Madurai study area...")

        # ── Wards ────────────────────────────────────────────────────────────
        for w in WARDS:
            session.add(Ward(**w, source="DEMO/SIMULATED", verified=False))
        session.commit()

        # ── Junctions ────────────────────────────────────────────────────────
        junc_dict = {}
        for (jid, lat, lng, jtype, ward) in JUNCTIONS_DATA:
            junc_dict[jid] = {"lat": lat, "lng": lng}
            session.add(Junction(
                junction_id=jid, latitude=lat, longitude=lng,
                junction_type=jtype, ward_id=ward,
                condition=random.choice(["good", "good", "fair", "fair", "poor"]),
                source="DEMO/SIMULATED", verified=False
            ))
        session.commit()

        # ── Drains ───────────────────────────────────────────────────────────
        for (did, fj, tj, dtype, length, width, depth, material, cond, ward, land_use) in DRAINS_DATA:
            fa = _junc_coords(junc_dict, fj)
            ta = _junc_coords(junc_dict, tj)
            mid = _midpoint(fa, ta)
            geometry = _line([fa, mid, ta])
            session.add(Drain(
                drain_id=did, geometry_json=geometry,
                drain_type=dtype, length_m=length, width_m=width, depth_m=depth,
                material=material, condition=cond, ward_id=ward,
                from_junction=fj, to_junction=tj,
                land_use=land_use, status="active",
                source="DEMO/SIMULATED", verified=False
            ))
        session.commit()

        # ── Blockage Incidents ────────────────────────────────────────────────
        incidents = _generate_incidents(junc_dict)
        for inc in incidents:
            session.add(BlockageIncident(**inc))
        session.commit()
        print(f"  Added {len(incidents)} blockage incidents")

        # ── Cleaning Records ──────────────────────────────────────────────────
        random.seed(77)
        cleaning_drains = ["D002", "D003", "D004", "D027", "D010", "D019", "D020",
                           "D028", "D001", "D007", "D012", "D018", "D022"]
        cleaning_count = 0
        for drain_id in cleaning_drains:
            n = random.randint(1, 3)
            for j in range(n):
                cleaning_count += 1
                cdate = date(random.choice([2023, 2024, 2025]), random.randint(1, 12), random.randint(1, 28))
                session.add(CleaningRecord(
                    cleaning_id=f"C{cleaning_count:03d}",
                    drain_id=drain_id,
                    cleaning_date=cdate,
                    method=random.choice(["manual", "mechanical", "jetting", "combined"]),
                    plastic_removed_kg=round(random.uniform(10, 80), 1),
                    total_waste_kg=round(random.uniform(30, 150), 1),
                    worker_agency="Demo Municipal Sanitation Dept.",
                    remarks="Demo cleaning record. NOT real data.",
                    source="DEMO/SIMULATED", verified=False
                ))
        session.commit()
        print(f"  Added {cleaning_count} cleaning records")

        # ── Rainfall ──────────────────────────────────────────────────────────
        rainfall_records = _generate_rainfall()
        for r in rainfall_records:
            session.add(Rainfall(**r))
        session.commit()
        print(f"  Added {len(rainfall_records)} rainfall records")

        # ── Risk Scores ───────────────────────────────────────────────────────
        # D027 is the worst drain — precompute realistic scores
        risk_presets = {
            "D027": (82, "HIGH", 38, 12, 10, 6, 2, 14),
            "D003": (78, "HIGH", 34, 10, 10, 8, 3, 13),
            "D004": (74, "HIGH", 32, 10, 8, 8, 4, 12),
            "D020": (71, "HIGH", 30, 10, 10, 6, 4, 11),
            "D002": (68, "HIGH", 28, 9, 9, 8, 5, 9),
            "D019": (65, "HIGH", 26, 9, 9, 6, 4, 11),
            "D028": (62, "MEDIUM", 24, 8, 9, 6, 5, 10),
            "D010": (58, "MEDIUM", 22, 8, 8, 6, 5, 9),
            "D007": (52, "MEDIUM", 20, 7, 8, 6, 4, 7),
            "D022": (49, "MEDIUM", 19, 7, 7, 6, 4, 6),
        }

        for (did, fj, tj, *_) in DRAINS_DATA:
            if did in risk_presets:
                ts, rl, bf, ps, rs, cs, acts, ca = risk_presets[did]
                session.add(RiskScore(
                    drain_id=did, calculation_date=date.today(),
                    blockage_frequency_score=bf, plastic_score=ps,
                    rainfall_score=rs, condition_score=cs,
                    activity_score=acts, cleaning_age_score=ca,
                    total_score=ts, risk_level=rl,
                    days_since_cleaning=random.randint(20, 60),
                    incident_count_total=random.randint(6, 14),
                    incident_count_plastic=random.randint(4, 12),
                    incident_count_heavy_rain=random.randint(3, 9),
                ))
            else:
                total = random.randint(10, 29)
                session.add(RiskScore(
                    drain_id=did, calculation_date=date.today(),
                    blockage_frequency_score=round(total * 0.30, 1),
                    plastic_score=round(total * 0.20, 1),
                    rainfall_score=round(total * 0.20, 1),
                    condition_score=round(total * 0.10, 1),
                    activity_score=round(total * 0.10, 1),
                    cleaning_age_score=round(total * 0.10, 1),
                    total_score=total, risk_level="LOW",
                    days_since_cleaning=random.randint(5, 90),
                    incident_count_total=random.randint(0, 3),
                    incident_count_plastic=random.randint(0, 2),
                    incident_count_heavy_rain=random.randint(0, 2),
                ))
        session.commit()

        # ── Interventions ─────────────────────────────────────────────────────
        interventions = [
            ("INT001", "D027", "immediate_inspection", "HIGH", "ASSIGNED",   "Officer Kumar",    date(2025, 9, 10), date(2025, 9, 15), 12, None),
            ("INT002", "D003", "preventive_cleaning",  "HIGH", "CLEANED",    "Sanitation Dept.", date(2025, 8, 20), date(2025, 8, 25), 10, 3),
            ("INT003", "D004", "immediate_inspection", "HIGH", "INSPECTED",  "Officer Priya",    date(2025, 9,  5), date(2025, 9, 12), 8,  None),
            ("INT004", "D020", "preventive_cleaning",  "HIGH", "OPEN",       None,               date(2025, 9, 12), None,             9,  None),
            ("INT005", "D010", "preventive_cleaning",  "MEDIUM","CLEANING_SCHEDULED","Team B",   date(2025, 9,  8), date(2025, 9, 18), 6,  None),
            ("INT006", "D002", "monitor",              "MEDIUM","VERIFIED",  "Officer Rajan",    date(2025, 7, 15), date(2025, 7, 20), 7,  2),
        ]
        for (iid, did, action, pri, status, assignee, cdate, tdate, before, after) in interventions:
            session.add(Intervention(
                intervention_id=iid, drain_id=did,
                recommended_action=action, priority=pri, status=status,
                assigned_to=assignee, created_date=cdate, target_date=tdate,
                before_incident_count=before, after_incident_count=after,
                notes="Demo intervention record. NOT real data."
            ))
        session.commit()

        # ── Users (demo) ──────────────────────────────────────────────────────
        users = [
            ("Admin User", "admin@demo.municipal.gov", "admin"),
            ("Officer Kumar", "kumar@demo.municipal.gov", "officer"),
            ("Officer Priya", "priya@demo.municipal.gov", "officer"),
            ("Field Worker Rajan", "rajan@demo.municipal.gov", "field_worker"),
            ("Field Worker Selvi", "selvi@demo.municipal.gov", "field_worker"),
        ]
        for (name, email, role) in users:
            session.add(User(name=name, email=email, role=role))
        session.commit()

        # ── Dataset Metadata ──────────────────────────────────────────────────
        metas = [
            ("Demo Drainage Network", "demo", None, date.today(), 30, "demo",
             "Synthetic drainage network for Madurai study area. NOT real municipal GIS data."),
            ("Demo Blockage Incidents", "demo", None, date.today(), 80, "demo",
             "Synthetic blockage incidents 2023–2025. NOT real historical records."),
            ("Demo Rainfall Records", "demo", None, date.today(), 730, "demo",
             "Synthetic daily rainfall 2023–2025 based on Madurai seasonal pattern. NOT real IMD data."),
            ("OpenStreetMap Basemap", "osm", "https://www.openstreetmap.org", date.today(), 0, "verified",
             "OSM tiles used as the background map. Licensed under ODbL."),
            ("data.gov.in", "government_gis", "https://data.gov.in", None, 0, "unverified",
             "Potential source for official municipal GIS data. Not yet imported."),
            ("IMD Rainfall Data", "rainfall", "https://mausam.imd.gov.in", None, 0, "unverified",
             "India Meteorological Department — official rainfall data source. Not yet imported."),
            ("PUNAL System", "punal", None, None, 0, "unverified",
             "Tamil Nadu drainage grievance system. Access to be requested from authority."),
        ]
        for (name, cat, url, cdate, count, vstatus, desc) in metas:
            session.add(DatasetMeta(
                dataset_name=name, source_category=cat, source_url=url,
                collection_date=cdate, record_count=count,
                verification_status=vstatus, description=desc
            ))
        session.commit()

        print("Demo seeding complete.")
        print("  4 wards | 30 junctions | 30 drains | 80 incidents | rainfall | risk scores | interventions")
        print("  ALL data labelled DEMO/SIMULATED — NOT real municipal records.")


if __name__ == "__main__":
    import random
    from app.db.database import create_db_and_tables
    create_db_and_tables()
    seed(force=True)

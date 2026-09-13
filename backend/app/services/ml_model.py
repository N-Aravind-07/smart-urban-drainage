"""ML prediction service — Random Forest with graceful fallback."""
from sqlmodel import Session, select
from app.db.models import BlockageIncident, Drain
from app.core.config import ML_MIN_RECORDS

INSUFFICIENT_RESPONSE = {
    "status": "insufficient_data",
    "message": (
        "Insufficient historical data for reliable ML prediction. "
        f"At least {ML_MIN_RECORDS} verified blockage records are required. "
        "The transparent risk score is being used instead."
    ),
    "records_available": 0,
    "records_required": ML_MIN_RECORDS,
    "recommendation": "Collect more real field data before relying on ML predictions.",
}


def train_and_predict(session: Session, drain_id: str) -> dict:
    """
    Attempt to train a Random Forest model and predict risk for a drain.
    Falls back gracefully if insufficient data.
    """
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import LabelEncoder
        import pandas as pd
        import numpy as np
    except ImportError:
        return {**INSUFFICIENT_RESPONSE, "message": "scikit-learn not installed."}

    incidents = session.exec(select(BlockageIncident)).all()
    drains_all = {d.drain_id: d for d in session.exec(select(Drain)).all()}

    # Only use records that have drain_id (for feature extraction)
    valid = [i for i in incidents if i.drain_id and i.drain_id in drains_all]

    response = dict(INSUFFICIENT_RESPONSE)
    response["records_available"] = len(valid)

    if len(valid) < ML_MIN_RECORDS:
        return response

    # Build feature matrix
    rows = []
    for inc in valid:
        d = drains_all[inc.drain_id]
        rows.append({
            "drain_id": inc.drain_id,
            "plastic": int(inc.plastic_present),
            "severity_num": {"low": 0, "medium": 1, "high": 2, "critical": 3}.get(inc.severity, 0),
            "rain_num": {"none": 0, "light": 1, "moderate": 2, "heavy": 3, "very_heavy": 4}.get(inc.rainfall_condition, 0),
            "condition_num": {"good": 0, "fair": 1, "poor": 2, "critical": 3, "unknown": 1}.get(d.condition, 1),
            "land_use_num": {"residential": 0, "mixed": 1, "commercial": 2, "market": 3, "industrial": 2}.get(d.land_use or "residential", 0),
            "waterlogging": int(inc.waterlogging),
            "month": inc.incident_date.month,
            "high_severity": int(inc.severity in ("high", "critical")),
        })

    df = pd.DataFrame(rows)

    # Target: high severity blockage
    X = df[["plastic", "severity_num", "rain_num", "condition_num", "land_use_num", "waterlogging", "month"]]
    y = df["high_severity"]

    if y.nunique() < 2:
        return response  # can't train with only one class

    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X, y)

    # Predict for target drain
    target_drain = drains_all.get(drain_id)
    if not target_drain:
        return response

    # Use average conditions for this drain
    drain_rows = df[df["drain_id"] == drain_id]
    if len(drain_rows) == 0:
        avg_rain = 2
        avg_plastic = 0
    else:
        avg_rain = int(drain_rows["rain_num"].mean())
        avg_plastic = int(drain_rows["plastic"].mean() > 0.5)

    cond_num = {"good": 0, "fair": 1, "poor": 2, "critical": 3, "unknown": 1}.get(target_drain.condition, 1)
    land_num = {"residential": 0, "mixed": 1, "commercial": 2, "market": 3, "industrial": 2}.get(target_drain.land_use or "residential", 0)

    X_pred = pd.DataFrame([{
        "plastic": avg_plastic,
        "severity_num": 2,
        "rain_num": avg_rain,
        "condition_num": cond_num,
        "land_use_num": land_num,
        "waterlogging": 1,
        "month": 10,  # peak monsoon
    }])

    prob = clf.predict_proba(X_pred)[0][1]
    risk_level = "HIGH" if prob > 0.6 else "MEDIUM" if prob > 0.35 else "LOW"

    # Feature importances
    feature_names = ["Plastic involvement", "Severity", "Rainfall", "Drain condition", "Land use", "Waterlogging", "Month"]
    importances = [
        {"feature": fn, "importance": round(float(fi), 3)}
        for fn, fi in sorted(zip(feature_names, clf.feature_importances_), key=lambda x: -x[1])
    ]

    return {
        "status": "success",
        "drain_id": drain_id,
        "probability_high_risk": round(float(prob), 3),
        "predicted_risk_level": risk_level,
        "feature_importances": importances,
        "model": "Random Forest (50 trees)",
        "records_used": len(valid),
        "disclaimer": (
            "This prediction is based on demo/simulated data. "
            "Do not use for real municipal decisions until verified historical records are available."
        ),
    }

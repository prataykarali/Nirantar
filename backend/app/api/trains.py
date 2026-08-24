"""
NIRANTAR — Train Search API Routes
=====================================
Deterministic train search from PostgreSQL instead of hardcoded mock data.
The LLM NEVER fabricates train data — it only explains deterministic results.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.models.base import get_db
from backend.app.models.journey_models import TrainModel, TrainAvailabilityModel, StationModel
from backend.app.services.ingestion.pipeline import public_notices_for_route

router = APIRouter(prefix="/api/v1/trains", tags=["Trains"])


@router.get("/search")
def search_trains(
    source: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    """
    Search trains by origin and destination.
    Uses station code or city name matching.
    Falls back to alias matching for flexible input.
    """
    from_code = (source or from_ or "").upper().strip()
    to_code = (destination or to or "").upper().strip()

    if not from_code or not to_code:
        raise HTTPException(400, "Both 'source' and 'destination' are required")

    # Resolve station codes (may be city names)
    from_station = _resolve_station(from_code, db)
    to_station = _resolve_station(to_code, db)

    if not from_station:
        raise HTTPException(404, f"Station not found: {source}")
    if not to_station:
        raise HTTPException(404, f"Station not found: {destination}")

    # Query trains
    trains = (
        db.query(TrainModel)
        .filter(
            TrainModel.from_station_code == from_station.code,
            TrainModel.to_station_code == to_station.code,
        )
        .all()
    )

    # If no direct match, try city-based matching
    if not trains:
        trains = (
            db.query(TrainModel)
            .filter(
                TrainModel.from_city.ilike(f"%{from_station.city}%"),
                TrainModel.to_city.ilike(f"%{to_station.city}%"),
            )
            .all()
        )

    notices = []
    try:
        notices = public_notices_for_route(from_station.code, to_station.code)
    except Exception:
        notices = []

    return {
        "trains": [_serialize_train(t, db) for t in trains],
        "origin": {"code": from_station.code, "name": from_station.name, "city": from_station.city},
        "destination": {"code": to_station.code, "name": to_station.name, "city": to_station.city},
        "count": len(trains),
        "publicInfo": {
            "disclaimer": (
                "Permitted public information for the Nirantar prototype. "
                "Not connected to live railway booking infrastructure."
            ),
            "notices": notices,
        },
    }


@router.get("/{train_number}")
def get_train_details(train_number: str, db: Session = Depends(get_db)):
    """Get detailed train information including all class availability."""
    train = db.query(TrainModel).filter_by(train_number=train_number).first()
    if not train:
        raise HTTPException(404, f"Train {train_number} not found")
    return _serialize_train(train, db)


@router.get("")
def list_all_trains(db: Session = Depends(get_db)):
    """List all trains in the database (for admin/debug)."""
    trains = db.query(TrainModel).all()
    return {
        "trains": [
            {
                "trainNumber": t.train_number,
                "trainName": t.train_name,
                "trainType": t.train_type,
                "from": f"{t.from_city} ({t.from_station_code})",
                "to": f"{t.to_city} ({t.to_station_code})",
            }
            for t in trains
        ],
        "count": len(trains),
    }


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def _resolve_station(query: str, db: Session) -> Optional[StationModel]:
    """Resolve a station code, city name, or alias to a StationModel."""
    # Direct code match
    station = db.query(StationModel).filter_by(code=query).first()
    if station:
        return station

    # City name match
    station = db.query(StationModel).filter(StationModel.city.ilike(query)).first()
    if station:
        return station

    # Full name match
    station = db.query(StationModel).filter(StationModel.name.ilike(f"%{query}%")).first()
    if station:
        return station

    # Alias match (JSON array search)
    all_stations = db.query(StationModel).all()
    for s in all_stations:
        if s.aliases and query in [a.upper() for a in s.aliases]:
            return s

    return None


def _serialize_train(t: TrainModel, db: Session) -> dict:
    avails = db.query(TrainAvailabilityModel).filter_by(train_id=t.id).all()
    return {
        "trainNumber": t.train_number,
        "trainName": t.train_name,
        "trainType": t.train_type,
        "fromStationCode": t.from_station_code,
        "fromStationName": t.from_station_name,
        "fromCity": t.from_city,
        "toStationCode": t.to_station_code,
        "toStationName": t.to_station_name,
        "toCity": t.to_city,
        "departureTime": t.departure_time,
        "arrivalTime": t.arrival_time,
        "durationHours": t.duration_hours,
        "distanceKm": t.distance_km,
        "runningDays": t.running_days or [],
        "classes": [
            {
                "classCode": a.class_code,
                "className": a.class_name,
                "fare": a.fare,
                "status": a.status,
                "availableSeats": a.available_seats,
                "confirmationProbability": a.confirmation_probability,
                "cateringIncluded": a.catering_included,
            }
            for a in avails
        ],
        "rating": t.rating,
        "punctualityScore": t.punctuality_score,
        "pantryAvailable": t.pantry_available,
        "cleanlinessScore": t.cleanliness_score,
        "isFastest": t.is_fastest,
        "isBestValue": t.is_best_value,
        "aiRecommendationReason": t.ai_recommendation_reason,
    }

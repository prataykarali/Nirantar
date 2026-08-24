"""
NIRANTAR — Journey API Routes
================================
RESTful endpoints for the citizen journey lifecycle.

Architecture Reference:
  - Architecture Doc §14 API Layer
  - Development Doc §15 Backend API Design
"""

import uuid
import random
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.models.base import get_db
from backend.app.models.journey_models import (
    JourneyModel, PassengerDraftModel, BookingModel,
    TrainModel, TrainAvailabilityModel, StationModel
)
from backend.app.services.fairness.access_layer import get_fair_access_layer

router = APIRouter(prefix="/api/v1/journeys", tags=["Journey"])


# ═══════════════════════════════════════════════════════════════
# REQUEST / RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════

class CreateJourneyRequest(BaseModel):
    origin_code: str
    destination_code: str
    travel_date: str
    passengers_count: int = 1
    class_type: Optional[str] = "All Classes"
    quota: Optional[str] = "General (GN)"


class AdvanceStepRequest(BaseModel):
    step: str


class PassengerData(BaseModel):
    name: str
    age: int
    gender: str
    berth_preference: str = "NO_PREFERENCE"
    senior_citizen_concession: bool = False
    id_proof_type: str = "Aadhaar Card"
    nationality: str = "Indian"


class SavePassengersRequest(BaseModel):
    passengers: List[PassengerData]


class SelectTrainRequest(BaseModel):
    train_number: str
    class_code: str


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("")
def create_journey(req: CreateJourneyRequest, db: Session = Depends(get_db)):
    """Create a new journey. Returns journey ID for state tracking."""
    # Validate stations exist
    origin = db.query(StationModel).filter_by(code=req.origin_code.upper()).first()
    dest = db.query(StationModel).filter_by(code=req.destination_code.upper()).first()

    if not origin:
        raise HTTPException(400, f"Unknown origin station: {req.origin_code}")
    if not dest:
        raise HTTPException(400, f"Unknown destination station: {req.destination_code}")
    if req.origin_code.upper() == req.destination_code.upper():
        raise HTTPException(400, "Origin and destination cannot be the same")

    journey = JourneyModel(
        id=str(uuid.uuid4()),
        origin_code=req.origin_code.upper(),
        destination_code=req.destination_code.upper(),
        travel_date=req.travel_date,
        passengers_count=req.passengers_count,
        class_type=req.class_type or "All Classes",
        quota=req.quota or "General (GN)",
        current_step="SEARCHED",
    )
    db.add(journey)
    db.commit()
    db.refresh(journey)

    access = get_fair_access_layer().admit(
        action="SEARCH_TRAINS",
        session_id=journey.id,
        origin=journey.origin_code,
        destination=journey.destination_code,
        travel_date=journey.travel_date,
        journey_id=journey.id,
    )

    return {
        "journeyId": journey.id,
        "step": journey.current_step,
        "createdAt": journey.created_at.isoformat() if journey.created_at else datetime.utcnow().isoformat(),
        "fairAccess": access,
    }


@router.get("/{journey_id}")
def get_journey(journey_id: str, db: Session = Depends(get_db)):
    """Get full journey state by ID."""
    journey = db.query(JourneyModel).filter_by(id=journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    # Build origin/destination station objects
    origin = db.query(StationModel).filter_by(code=journey.origin_code).first()
    dest = db.query(StationModel).filter_by(code=journey.destination_code).first()

    # Build passengers
    passengers = [
        {
            "id": p.id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "berthPreference": p.berth_preference,
            "seniorCitizenConcession": p.senior_citizen_concession,
            "idProofType": p.id_proof_type,
            "nationality": p.nationality,
        }
        for p in journey.passengers
    ]

    # Build booking if exists
    booking = None
    if journey.booking:
        b = journey.booking
        booking = {
            "bookingId": b.id,
            "journeyId": b.journey_id,
            "bookingReference": b.booking_reference,
            "pnrNumber": b.pnr_number,
            "trainNumber": b.train_number,
            "trainName": b.train_name,
            "classCode": b.class_code,
            "status": b.status,
            "seatAllotment": {
                "coach": b.coach,
                "seatNumber": b.seat_number,
                "berthType": b.berth_type,
            } if b.coach else None,
            "createdAt": b.created_at.isoformat() if b.created_at else None,
        }

    # Build selected train if set
    selected_train = None
    if journey.selected_train_number:
        train = db.query(TrainModel).filter_by(train_number=journey.selected_train_number).first()
        if train:
            selected_train = _serialize_train(train, db)

    return {
        "journeyId": journey.id,
        "userId": journey.user_id,
        "step": journey.current_step,
        "origin": _serialize_station(origin) if origin else None,
        "destination": _serialize_station(dest) if dest else None,
        "travelDate": journey.travel_date,
        "passengersCount": journey.passengers_count,
        "classType": journey.class_type,
        "quota": journey.quota,
        "selectedTrain": selected_train,
        "selectedClassCode": journey.selected_class_code,
        "passengers": passengers,
        "booking": booking,
        "status": journey.status,
        "createdAt": journey.created_at.isoformat() if journey.created_at else None,
        "updatedAt": journey.updated_at.isoformat() if journey.updated_at else None,
    }


@router.put("/{journey_id}/step")
def advance_step(journey_id: str, req: AdvanceStepRequest, db: Session = Depends(get_db)):
    """Advance journey to a new step."""
    journey = db.query(JourneyModel).filter_by(id=journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    journey.current_step = req.step
    journey.updated_at = datetime.utcnow()
    db.commit()
    return {"step": journey.current_step}


@router.post("/{journey_id}/passengers")
def save_passengers(journey_id: str, req: SavePassengersRequest, db: Session = Depends(get_db)):
    """Save passenger drafts for a journey."""
    journey = db.query(JourneyModel).filter_by(id=journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    # Clear existing drafts
    db.query(PassengerDraftModel).filter_by(journey_id=journey_id).delete()

    for p in req.passengers:
        db.add(PassengerDraftModel(
            journey_id=journey_id,
            name=p.name,
            age=p.age,
            gender=p.gender,
            berth_preference=p.berth_preference,
            senior_citizen_concession=p.senior_citizen_concession,
            id_proof_type=p.id_proof_type,
            nationality=p.nationality,
        ))

    journey.passengers_count = len(req.passengers)
    journey.current_step = "PASSENGER_REVIEW"
    journey.updated_at = datetime.utcnow()
    db.commit()
    return {"saved": True, "count": len(req.passengers)}


@router.post("/{journey_id}/select-train")
def select_train(journey_id: str, req: SelectTrainRequest, db: Session = Depends(get_db)):
    """Select a train for a journey."""
    journey = db.query(JourneyModel).filter_by(id=journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    train = db.query(TrainModel).filter_by(train_number=req.train_number).first()
    if not train:
        raise HTTPException(404, f"Train {req.train_number} not found")

    journey.selected_train_number = req.train_number
    journey.selected_class_code = req.class_code
    journey.current_step = "TRAIN_SELECTED"
    journey.updated_at = datetime.utcnow()
    db.commit()
    return {"selected": True, "trainNumber": req.train_number, "classCode": req.class_code}


@router.get("/{journey_id}/ticket")
def get_ticket(journey_id: str, db: Session = Depends(get_db)):
    """Get the issued ticket for a journey."""
    journey = db.query(JourneyModel).filter_by(id=journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    if not journey.booking:
        raise HTTPException(404, "No ticket issued for this journey yet")

    b = journey.booking
    origin = db.query(StationModel).filter_by(code=journey.origin_code).first()
    dest = db.query(StationModel).filter_by(code=journey.destination_code).first()
    train = db.query(TrainModel).filter_by(train_number=b.train_number).first()

    return {
        "ticketId": b.id,
        "journeyId": journey.id,
        "bookingReference": b.booking_reference,
        "pnrNumber": b.pnr_number,
        "train": _serialize_train(train, db) if train else None,
        "classCode": b.class_code,
        "passengers": [
            {
                "id": p.id,
                "name": p.name,
                "age": p.age,
                "gender": p.gender,
                "berthPreference": p.berth_preference,
            }
            for p in journey.passengers
        ],
        "seatAllotments": [{
            "coach": b.coach,
            "seatNumber": b.seat_number,
            "berthType": b.berth_type,
        }] if b.coach else [],
        "travelDate": journey.travel_date,
        "origin": _serialize_station(origin) if origin else None,
        "destination": _serialize_station(dest) if dest else None,
        "status": "ACTIVE",
        "issuedAt": b.created_at.isoformat() if b.created_at else None,
    }


@router.get("")
def list_journeys(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all journeys, optionally filtered by user."""
    query = db.query(JourneyModel).order_by(JourneyModel.created_at.desc())
    if user_id:
        query = query.filter_by(user_id=user_id)
    journeys = query.limit(20).all()

    return {
        "journeys": [
            {
                "journeyId": j.id,
                "originCode": j.origin_code,
                "destinationCode": j.destination_code,
                "travelDate": j.travel_date,
                "step": j.current_step,
                "status": j.status,
                "trainNumber": j.selected_train_number,
                "createdAt": j.created_at.isoformat() if j.created_at else None,
            }
            for j in journeys
        ]
    }


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def _serialize_station(s: StationModel) -> dict:
    return {
        "code": s.code,
        "name": s.name,
        "city": s.city,
        "state": s.state,
        "aliases": s.aliases or [],
    }


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

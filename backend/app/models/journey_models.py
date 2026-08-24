"""
NIRANTAR — Journey Domain Models
==================================
SQLAlchemy models for the complete citizen journey.
Covers: stations, trains, journeys, passengers, bookings, payments, tickets, users, AI audit.

Architecture Reference:
  - Development Doc §5 Core Domain Model
  - Architecture Doc §7 Data & Storage
  - Architecture Doc §11 Payment State Machine
"""

import uuid
import enum
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Enum, JSON, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════

class JourneyStepEnum(str, enum.Enum):
    DISCOVER = "DISCOVER"
    SEARCHED = "SEARCHED"
    TRAIN_SELECTED = "TRAIN_SELECTED"
    PASSENGER_REVIEW = "PASSENGER_REVIEW"
    AUTH_REQUIRED = "AUTH_REQUIRED"
    AUTHENTICATED = "AUTHENTICATED"
    PAYMENT_READY = "PAYMENT_READY"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    PAYMENT_UNKNOWN = "PAYMENT_UNKNOWN"
    PAYMENT_VERIFYING = "PAYMENT_VERIFYING"
    TICKET_ISSUED = "TICKET_ISSUED"
    TRACKING = "TRACKING"


class PaymentStateEnum(str, enum.Enum):
    READY = "READY"
    INITIATED = "INITIATED"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    UNKNOWN = "UNKNOWN"
    VERIFYING = "VERIFYING"
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED"


class PaymentMethodEnum(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NET_BANKING = "NET_BANKING"
    WALLET = "WALLET"


class BookingStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    RAC = "RAC"
    WAITLIST = "WAITLIST"
    CANCELLED = "CANCELLED"


class TrainTypeEnum(str, enum.Enum):
    VANDE_BHARAT = "VANDE_BHARAT"
    RAJDHANI = "RAJDHANI"
    SHATABDI = "SHATABDI"
    DURONTO = "DURONTO"
    SUPERFAST = "SUPERFAST"
    MAIL_EXPRESS = "MAIL_EXPRESS"


# ═══════════════════════════════════════════════════════════════
# STATION MODEL
# ═══════════════════════════════════════════════════════════════

class StationModel(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    aliases = Column(JSON, default=list)  # List of alternative codes/names


# ═══════════════════════════════════════════════════════════════
# TRAIN MODEL + AVAILABILITY
# ═══════════════════════════════════════════════════════════════

class TrainModel(Base):
    __tablename__ = "trains"

    id = Column(String, primary_key=True, default=generate_uuid)
    train_number = Column(String(10), unique=True, nullable=False, index=True)
    train_name = Column(String(100), nullable=False)
    train_type = Column(String(20), nullable=False)
    from_station_code = Column(String(10), ForeignKey("stations.code"), nullable=False)
    from_station_name = Column(String(100), nullable=False)
    from_city = Column(String(50), nullable=False)
    to_station_code = Column(String(10), ForeignKey("stations.code"), nullable=False)
    to_station_name = Column(String(100), nullable=False)
    to_city = Column(String(50), nullable=False)
    departure_time = Column(String(10), nullable=False)
    arrival_time = Column(String(10), nullable=False)
    duration_hours = Column(String(20), nullable=False)
    distance_km = Column(Integer, nullable=False)
    running_days = Column(JSON, default=list)  # ['Mon', 'Tue', ...]
    rating = Column(Float, default=4.5)
    punctuality_score = Column(Integer, default=90)
    pantry_available = Column(Boolean, default=False)
    cleanliness_score = Column(Integer, default=90)
    is_fastest = Column(Boolean, default=False)
    is_best_value = Column(Boolean, default=False)
    ai_recommendation_reason = Column(Text, nullable=True)

    # Relationships
    availabilities = relationship("TrainAvailabilityModel", back_populates="train", cascade="all, delete-orphan")


class TrainAvailabilityModel(Base):
    __tablename__ = "train_availability"

    id = Column(String, primary_key=True, default=generate_uuid)
    train_id = Column(String, ForeignKey("trains.id"), nullable=False)
    class_code = Column(String(5), nullable=False)  # '1A', '2A', '3A', 'SL', 'CC', 'EC'
    class_name = Column(String(50), nullable=False)
    fare = Column(Integer, nullable=False)
    status = Column(String(20), default="AVAILABLE")  # AVAILABLE, RAC, WL
    available_seats = Column(Integer, default=0)
    confirmation_probability = Column(Integer, nullable=True)
    catering_included = Column(Boolean, default=False)

    # Relationships
    train = relationship("TrainModel", back_populates="availabilities")


# ═══════════════════════════════════════════════════════════════
# USER MODEL
# ═══════════════════════════════════════════════════════════════

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    display_name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    # Password hash — NEVER sent to AI context
    password_hash = Column(String(255), nullable=False)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    journeys = relationship("JourneyModel", back_populates="user")


# ═══════════════════════════════════════════════════════════════
# JOURNEY MODEL — the central state entity
# ═══════════════════════════════════════════════════════════════

class JourneyModel(Base):
    __tablename__ = "journeys"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    origin_code = Column(String(10), nullable=False)
    destination_code = Column(String(10), nullable=False)
    travel_date = Column(String(15), nullable=False)
    passengers_count = Column(Integer, default=1)
    class_type = Column(String(30), default="All Classes")
    quota = Column(String(30), default="General (GN)")
    current_step = Column(String(30), default="DISCOVER")
    selected_train_number = Column(String(10), nullable=True)
    selected_class_code = Column(String(5), nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("UserModel", back_populates="journeys")
    passengers = relationship("PassengerDraftModel", back_populates="journey", cascade="all, delete-orphan")
    booking = relationship("BookingModel", back_populates="journey", uselist=False)
    payment_attempts = relationship("PaymentAttemptModel", back_populates="journey", cascade="all, delete-orphan")


# ═══════════════════════════════════════════════════════════════
# PASSENGER DRAFT MODEL
# ═══════════════════════════════════════════════════════════════

class PassengerDraftModel(Base):
    __tablename__ = "passenger_drafts"

    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, ForeignKey("journeys.id"), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(1), nullable=False)  # M, F, O
    berth_preference = Column(String(20), default="NO_PREFERENCE")
    senior_citizen_concession = Column(Boolean, default=False)
    id_proof_type = Column(String(30), default="Aadhaar Card")
    nationality = Column(String(30), default="Indian")

    # Relationships
    journey = relationship("JourneyModel", back_populates="passengers")


# ═══════════════════════════════════════════════════════════════
# BOOKING MODEL
# ═══════════════════════════════════════════════════════════════

class BookingModel(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, ForeignKey("journeys.id"), unique=True, nullable=False)
    booking_reference = Column(String(20), unique=True, nullable=False)
    pnr_number = Column(String(20), unique=True, nullable=False)
    train_number = Column(String(10), nullable=False)
    train_name = Column(String(100), nullable=False)
    class_code = Column(String(5), nullable=False)
    status = Column(String(20), default="CONFIRMED")
    coach = Column(String(10), nullable=True)
    seat_number = Column(Integer, nullable=True)
    berth_type = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    journey = relationship("JourneyModel", back_populates="booking")


# ═══════════════════════════════════════════════════════════════
# PAYMENT ATTEMPT MODEL — Architecture Doc §11
# ═══════════════════════════════════════════════════════════════

class PaymentAttemptModel(Base):
    __tablename__ = "payment_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, ForeignKey("journeys.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    method = Column(String(20), nullable=False)  # UPI, CARD, NET_BANKING, WALLET
    state = Column(String(20), default="READY")
    idempotency_key = Column(String(100), unique=True, nullable=False)
    transaction_ref = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    journey = relationship("JourneyModel", back_populates="payment_attempts")

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_payment_idempotency"),
    )


# ═══════════════════════════════════════════════════════════════
# NIRA AI EVENT LOG — Architecture Doc §15
# NEVER stores passwords, OTPs, PINs, CVVs, or tokens.
# ═══════════════════════════════════════════════════════════════

class NiraEventModel(Base):
    __tablename__ = "nira_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, nullable=True)
    intent = Column(String(50), nullable=True)
    action = Column(String(50), nullable=True)
    entities = Column(JSON, nullable=True)  # Safe structured data only
    validation_result = Column(String(20), nullable=True)  # ALLOWED, REJECTED
    timestamp = Column(DateTime, default=datetime.utcnow)

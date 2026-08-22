"""
NIRANTAR Module 0 — Simulated Microservices
============================================
Mock implementations of public-service microservices:
Auth, Profile, Search, Availability, Booking, Payment, Application, Notification.
Zero Real PII. Thread-safe operations with simulated network latency and failure injection.
"""

import json
import random
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple
from .database import DigitalTwinDatabase, get_db
from .models import (
    CitizenProfile,
    BookingRequest,
    BookingRecord,
    BookingStatus,
    PaymentTransaction,
    PaymentStatus,
    PaymentMethod,
    ApplicationRecord,
    Passenger,
)


class AuthService:
    """Simulated Citizen Authentication & Session Service."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self._active_sessions: Dict[str, str] = {}

    def authenticate_token(self, token: str) -> Optional[str]:
        """Validate bearer token and return anonymized citizen_id."""
        if not token or not token.startswith("tok_"):
            return None
        # In mock mode, tok_cit001 maps to CIT-001
        return self._active_sessions.get(token, "CIT-001")

    def create_session(self, citizen_id: str) -> str:
        token = f"tok_{uuid.uuid4().hex[:12]}"
        self._active_sessions[token] = citizen_id
        return token


class CitizenProfileService:
    """Citizen Profile & Synthetic DigiLocker Document Vault Service."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()

    def get_profile(self, citizen_id: str) -> Dict[str, Any]:
        """Return masked synthetic profile with linked certificates."""
        return {
            "citizen_id": citizen_id,
            "masked_name": "A*** K****",
            "phone_masked": "+91-98****1234",
            "preferred_language": "hi",
            "linked_documents": [
                {"doc_type": "AADHAAR_MASKED", "doc_id": "VID-XXXX-9901", "status": "VERIFIED"},
                {"doc_type": "INCOME_CERTIFICATE", "doc_id": "INC/2026/884", "status": "ACTIVE"},
            ],
        }


class SearchService:
    """Train, Station & Schedule Query Service."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()

    def list_stations(self, zone_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        stations = self.db.list_stations()
        if zone_filter:
            return [s for s in stations if s.get("zone") == zone_filter.upper()]
        return stations

    def search_routes(self, source: str, destination: str) -> List[Dict[str, Any]]:
        """Search trains connecting source and destination stations."""
        if not source or not destination:
            return []
        return self.db.search_trains(source.upper(), destination.upper())


class AvailabilityService:
    """Real-time Seat Inventory & Fare Evaluation Service."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()

    def check_availability(
        self, train_no: str, travel_date: str, class_type: str, quota: str = "GN"
    ) -> Dict[str, Any]:
        """Query real-time availability and dynamic quota status."""
        inv = self.db.get_inventory(train_no, travel_date, class_type.upper(), quota.upper())
        if not inv:
            return {
                "available": False,
                "status": "NOT_FOUND",
                "available_seats": 0,
                "fare_inr": 0.0,
            }

        avail_count = inv["available_seats"]
        status = "AVAILABLE" if avail_count > 0 else "WAITLIST"
        return {
            "available": avail_count > 0,
            "status": status,
            "available_seats": avail_count,
            "booked_seats": inv["booked_seats"],
            "total_capacity": inv["total_capacity"],
            "fare_inr": inv["fare_inr"],
            "quota": quota.upper(),
        }


class PaymentService:
    """Simulated Gateway with Configurable Latency, Success Rate & Chaos Injection."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self.failure_rate: float = 0.05  # 5% default failure
        self.timeout_rate: float = 0.02  # 2% default timeout
        self.base_latency_ms: float = 65.0

    def process_payment(
        self,
        booking_id: str,
        amount_inr: float,
        method: PaymentMethod = PaymentMethod.UPI,
    ) -> PaymentTransaction:
        """Simulate payment execution with realistic gateway latency."""
        roll = random.random()
        latency = self.base_latency_ms + random.uniform(10.0, 50.0)

        if roll < self.timeout_rate:
            status = PaymentStatus.TIMEOUT
            latency += 450.0
        elif roll < (self.timeout_rate + self.failure_rate):
            status = PaymentStatus.FAILURE
        else:
            status = PaymentStatus.SUCCESS

        txn = PaymentTransaction(
            booking_id=booking_id,
            amount_inr=amount_inr,
            method=method,
            status=status,
            latency_ms=latency,
        )
        self.db.insert_payment(txn)
        return txn


class BookingService:
    """High-Concurrency Booking Service with Atomic Inventory Locks."""

    def __init__(
        self,
        db: Optional[DigitalTwinDatabase] = None,
        payment_service: Optional[PaymentService] = None,
    ) -> None:
        self.db = db or get_db()
        self.payment_service = payment_service or PaymentService(self.db)

    def initiate_booking(self, req: BookingRequest) -> Tuple[BookingRecord, Optional[PaymentTransaction]]:
        """Atomic seat reservation + payment trigger flow."""
        seat_count = max(1, len(req.passengers))
        inv = self.db.get_inventory(req.train_no, req.travel_date, req.class_type, req.quota)

        if not inv or inv["available_seats"] < seat_count:
            record = BookingRecord(
                citizen_id=req.citizen_id,
                train_no=req.train_no,
                travel_date=req.travel_date,
                class_type=req.class_type,
                quota=req.quota,
                source_station=req.source_station,
                destination_station=req.destination_station,
                passengers=req.passengers,
                status=BookingStatus.FAILED,
                total_amount_inr=0.0,
            )
            return record, None

        total_amount = inv["fare_inr"] * seat_count
        reserved = self.db.reserve_seats(
            req.train_no, req.travel_date, req.class_type, req.quota, seat_count
        )
        if not reserved:
            record = BookingRecord(
                citizen_id=req.citizen_id,
                train_no=req.train_no,
                travel_date=req.travel_date,
                class_type=req.class_type,
                quota=req.quota,
                source_station=req.source_station,
                destination_station=req.destination_station,
                passengers=req.passengers,
                status=BookingStatus.FAILED,
                total_amount_inr=total_amount,
            )
            return record, None

        # Process simulated payment
        record = BookingRecord(
            citizen_id=req.citizen_id,
            train_no=req.train_no,
            travel_date=req.travel_date,
            class_type=req.class_type,
            quota=req.quota,
            source_station=req.source_station,
            destination_station=req.destination_station,
            passengers=req.passengers,
            total_amount_inr=total_amount,
        )

        txn = self.payment_service.process_payment(record.booking_id, total_amount)
        if txn.status == PaymentStatus.SUCCESS:
            record.status = BookingStatus.CONFIRMED
            record.payment_id = txn.transaction_id
        else:
            record.status = BookingStatus.FAILED

        passengers_payload = json.dumps([p.__dict__ for p in req.passengers])
        self.db.insert_booking(record, passengers_payload)
        return record, txn


class ApplicationService:
    """Generic Civic Application Workflow (Certificates, Land Records, Pensions)."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()

    def submit_application(
        self, citizen_id: str, service_code: str, service_name: str, payload: Dict[str, Any]
    ) -> ApplicationRecord:
        record = ApplicationRecord(
            citizen_id=citizen_id,
            service_code=service_code,
            service_name=service_name,
            submitted_data=payload,
        )
        return record


class NotificationService:
    """Mock Multi-Channel Citizen Dispatcher (SMS, WhatsApp, Voice)."""

    def __init__(self) -> None:
        self.sent_messages: List[Dict[str, Any]] = []

    def send_confirmation(self, phone: str, pnr: str, status: str, lang: str = "hi") -> bool:
        templates = {
            "hi": f"नमस्ते! आपका PNR {pnr} सफलतापूर्वक {status} हो गया है। NIRANTAR सेवा।",
            "bn": f"নমস্কার! আপনার PNR {pnr} সফলভাবে {status} হয়েছে। NIRANTAR সেবা।",
            "en": f"Hello! Your PNR {pnr} has been {status} successfully. NIRANTAR Civic.",
        }
        msg = templates.get(lang, templates["en"])
        self.sent_messages.append({
            "phone": phone,
            "pnr": pnr,
            "message": msg,
            "timestamp": time.time(),
        })
        return True

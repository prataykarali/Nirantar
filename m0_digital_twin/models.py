"""
NIRANTAR Module 0 — Data Models & Schemas
=========================================
Strictly synthetic schemas for public-service digital twin entities.
Zero real PII. All citizen identities are anonymized synthetic representations.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid


class QuotaType(str, Enum):
    GENERAL = "GN"
    TATKAL = "TQ"
    PREMIUM_TATKAL = "PT"
    LADIES = "LD"
    SENIOR_CITIZEN = "SS"


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    RAC = "RAC"
    WAITLIST = "WAITLIST"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    TIMEOUT = "TIMEOUT"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, Enum):
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    DEBIT_CARD = "DEBIT_CARD"
    CREDIT_CARD = "CREDIT_CARD"


class ServiceCategory(str, Enum):
    RAILWAY = "RAILWAY"
    CIVIC_CERTIFICATE = "CIVIC_CERTIFICATE"
    LAND_RECORDS = "LAND_RECORDS"
    PENSION_EPFO = "PENSION_EPFO"
    MUNICIPAL_TAX = "MUNICIPAL_TAX"


class ThreatLevel(str, Enum):
    LEGITIMATE = "LEGITIMATE"
    SUSPICIOUS = "SUSPICIOUS"
    BOT_ATTACK = "BOT_ATTACK"
    DDOS = "DDOS"


@dataclass
class CitizenProfile:
    """Synthetic citizen profile with masked identifiers (Zero Real PII)."""
    citizen_id: str = field(default_factory=lambda: f"CIT-{uuid.uuid4().hex[:8].upper()}")
    name_masked: str = "A*** K****"
    preferred_language: str = "hi"
    phone_masked: str = "+91-98****1234"
    auth_token: str = field(default_factory=lambda: f"tok_{uuid.uuid4().hex}")
    virtual_id: str = field(default_factory=lambda: f"VID-{uuid.uuid4().hex[:12].upper()}")
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class Station:
    """Railway station entity."""
    code: str
    name: str
    zone: str
    state: str
    division: str = "General"


@dataclass
class Train:
    """Train definition entity."""
    train_no: str
    train_name: str
    train_type: str  # Rajdhani, Shatabdi, Superfast, Express
    source_station: str
    destination_station: str
    available_classes: List[str] = field(default_factory=lambda: ["1A", "2A", "3A", "SL"])
    tatkal_enabled: bool = True
    base_fare_inr: Dict[str, float] = field(default_factory=lambda: {
        "1A": 2800.0, "2A": 1650.0, "3A": 1150.0, "SL": 420.0
    })


@dataclass
class Schedule:
    """Train schedule and stop timing."""
    train_no: str
    station_code: str
    arrival_time: str
    departure_time: str
    halt_minutes: int
    day_offset: int
    distance_km: int


@dataclass
class SeatInventory:
    """Real-time seat inventory per train, date, class, and quota."""
    train_no: str
    travel_date: str  # YYYY-MM-DD
    class_type: str   # 1A, 2A, 3A, SL
    quota: str        # GN, TQ, PT
    total_capacity: int
    available_seats: int
    booked_seats: int = 0
    rac_count: int = 0
    waitlist_count: int = 0
    fare_inr: float = 1000.0
    is_locked: bool = False

    def is_available(self, seats_requested: int = 1) -> bool:
        return self.available_seats >= seats_requested


@dataclass
class Passenger:
    """Synthetic passenger in booking payload."""
    passenger_id: str = field(default_factory=lambda: uuid.uuid4().hex[:6])
    name_masked: str = "P****"
    age: int = 30
    gender: str = "M"
    berth_preference: Optional[str] = "LOWER"
    seat_allocated: Optional[str] = None


@dataclass
class BookingRequest:
    """Booking request initiated by citizen/agent."""
    citizen_id: str
    train_no: str
    travel_date: str
    class_type: str
    quota: str
    source_station: str
    destination_station: str
    passengers: List[Passenger]
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))


@dataclass
class BookingRecord:
    """Completed booking state with PNR."""
    booking_id: str = field(default_factory=lambda: f"BK-{uuid.uuid4().hex[:8].upper()}")
    pnr: str = field(default_factory=lambda: f"{uuid.uuid4().int % 9000000000 + 1000000000}")
    citizen_id: str = ""
    train_no: str = ""
    travel_date: str = ""
    class_type: str = ""
    quota: str = ""
    source_station: str = ""
    destination_station: str = ""
    passengers: List[Passenger] = field(default_factory=list)
    status: BookingStatus = BookingStatus.PENDING
    payment_id: Optional[str] = None
    total_amount_inr: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class PaymentTransaction:
    """Payment transaction details."""
    transaction_id: str = field(default_factory=lambda: f"TXN-{uuid.uuid4().hex[:10].upper()}")
    booking_id: str = ""
    amount_inr: float = 0.0
    method: PaymentMethod = PaymentMethod.UPI
    status: PaymentStatus = PaymentStatus.INITIATED
    gateway_ref: str = field(default_factory=lambda: f"GW-{uuid.uuid4().hex[:6]}")
    latency_ms: float = 45.0
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class ApplicationRecord:
    """Generic civic service application record (e.g. Caste/Income Certificate, Land Mutation)."""
    application_id: str = field(default_factory=lambda: f"APP-{uuid.uuid4().hex[:8].upper()}")
    citizen_id: str = ""
    service_code: str = "BSK-CERT-01"
    service_name: str = "Domicile Certificate"
    category: ServiceCategory = ServiceCategory.CIVIC_CERTIFICATE
    status: str = "SUBMITTED"
    submitted_data: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class TelemetryMetric:
    """Microservice telemetry event emitted periodically."""
    service_name: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    requests_per_sec: float = 0.0
    concurrent_users: int = 0
    cpu_percent: float = 0.0
    ram_percent: float = 0.0
    network_mbps: float = 0.0
    latency_p50_ms: float = 0.0
    latency_p99_ms: float = 0.0
    error_rate: float = 0.0
    queue_length: int = 0
    throughput_rps: float = 0.0


@dataclass
class SecurityEvent:
    """Security audit event."""
    event_id: str = field(default_factory=lambda: f"SEC-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ip_address: str = "127.0.0.1"
    user_agent: str = "Mozilla/5.0 Synthetic"
    event_type: str = "REQUEST_EVALUATION"
    threat_level: ThreatLevel = ThreatLevel.LEGITIMATE
    threat_score: float = 0.02
    details: Dict[str, Any] = field(default_factory=dict)

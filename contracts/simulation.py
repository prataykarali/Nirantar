"""
NIRANTAR Contracts — Simulation, Load & Chaos Schemas
=====================================================
Owned by Agent 5 (SENTINEL / Kavach), driving the 10,000 Virtual User Locust testbed.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List
from pydantic import BaseModel, Field
import uuid


class WorkloadType(str, Enum):
    BASELINE_IDLE = "BASELINE_IDLE"
    NORMAL_DAYTIME = "NORMAL_DAYTIME"
    TATKAL_PEAK = "TATKAL_PEAK"
    BOT_SURGE = "BOT_SURGE"
    CHAOS_FAILURE = "CHAOS_FAILURE"


class ChaosFailureMode(str, Enum):
    NONE = "NONE"
    CPU_SATURATION = "CPU_SATURATION"
    LATENCY_INJECTION = "LATENCY_INJECTION"
    NETWORK_LATENCY = "NETWORK_LATENCY"
    DATABASE_LOCK = "DATABASE_LOCK"
    DATABASE_SLOWDOWN = "DATABASE_SLOWDOWN"
    API_FAILURE = "API_FAILURE"
    SERVICE_UNRESPONSIVE = "SERVICE_UNRESPONSIVE"
    TRAFFIC_SPIKE = "TRAFFIC_SPIKE"


class DeviceType(str, Enum):
    DESKTOP = "DESKTOP"
    MOBILE = "MOBILE"
    FEATURE_PHONE = "FEATURE_PHONE"


class PersonaKind(str, Enum):
    NORMAL = "NORMAL"
    SEARCH_HEAVY = "SEARCH_HEAVY"
    RETURNING = "RETURNING"
    SLOW_MOBILE = "SLOW_MOBILE"
    RETRY_HEAVY = "RETRY_HEAVY"
    SUSPICIOUS = "SUSPICIOUS"
    ABANDONED = "ABANDONED"
    RURAL = "RURAL"
    TATKAL_RUSH = "TATKAL_RUSH"
    COMMUTER = "COMMUTER"
    BOT_SCALPER = "BOT_SCALPER"



class JourneyStep(str, Enum):
    OPEN = "OPEN"
    SEARCH = "SEARCH"
    THINK = "THINK"
    RESULTS = "RESULTS"
    SELECT = "SELECT"
    AUTHENTICATE = "AUTHENTICATE"
    BOOK = "BOOK"
    PAYMENT = "PAYMENT"
    CONFIRMATION = "CONFIRMATION"
    ABANDON = "ABANDON"


class TrafficScenarioKind(str, Enum):
    NORMAL = "NORMAL"
    PEAK = "PEAK"
    EXTREME = "EXTREME"
    SUDDEN_SPIKE = "SUDDEN_SPIKE"
    BOT_SURGE = "BOT_SURGE"
    INFRA_DEGRADATION = "INFRA_DEGRADATION"


class WorkloadProfile(BaseModel):
    """Configuration defining traffic characteristics."""
    workload_type: WorkloadType = WorkloadType.NORMAL_DAYTIME
    target_rps: float = 100.0
    concurrent_virtual_users: int = 1000
    duration_seconds: int = 60
    ramp_up_seconds: int = 10


class ChaosInjectionConfig(BaseModel):
    """Fault injection configuration for resilience stress testing."""
    target_service: str = "SeatInventoryDB"
    failure_mode: ChaosFailureMode = ChaosFailureMode.NONE
    injected_latency_ms: float = 0.0
    forced_error_rate: float = 0.0
    start_after_seconds: int = 20
    duration_seconds: int = 30


class SimulationScenarioConfig(BaseModel):
    """Complete simulation scenario description."""
    scenario_id: str = Field(default_factory=lambda: f"SCN-{uuid.uuid4().hex[:8].upper()}")
    name: str = "Tatkal 10K Peak Surge"
    description: str = "Simulates 10,000 concurrent virtual users hitting the Tatkal window."
    workload: WorkloadProfile = Field(default_factory=WorkloadProfile)
    chaos: ChaosInjectionConfig = Field(default_factory=ChaosInjectionConfig)
    expected_resilience_score: float = 0.85
    kind: TrafficScenarioKind = TrafficScenarioKind.EXTREME
    persona_mix: Dict[str, int] = Field(default_factory=dict)
    spike_stages: List[Dict[str, int]] = Field(default_factory=list)


class VirtualCitizen(BaseModel):
    """One synthetic citizen hitting the public-service mock."""
    user_id: str
    intent: str = "BOOK_TRAIN"
    language: str = "hi"
    device: DeviceType = DeviceType.DESKTOP
    arrival_time_s: float = 0.0
    think_time_s: float = 1.5
    session_duration_s: float = 90.0
    journey: List[JourneyStep] = Field(default_factory=list)
    persona: PersonaKind = PersonaKind.NORMAL
    ip_hash: str = "ip_hash_local"


class SpikeStage(BaseModel):
    users: int
    duration_s: int = 30
    spawn_rate: int = 50


class CriticalJourneyVerdict(BaseModel):
    """Did DHARA keep the booking path alive under load/chaos?"""
    maintained: bool = True
    dhara_state: str = "NORMAL"
    booking_success_rate: float = 1.0
    legit_completed: int = 0
    legit_queued: int = 0
    legit_dropped: int = 0
    suspicious_throttled: int = 0
    suspicious_total: int = 0
    protected_services: List[str] = Field(default_factory=list)
    shed_features: List[str] = Field(default_factory=list)
    database_protection_enabled: bool = False
    reason: str = ""


class CitizenOutcome(BaseModel):
    user_id: str
    persona: PersonaKind
    outcome: str
    steps_completed: int = 0
    queued: bool = False
    throttled: bool = False


class PrayogRunSummary(BaseModel):
    run_id: str = Field(default_factory=lambda: f"PRG-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    scenario: TrafficScenarioKind = TrafficScenarioKind.NORMAL
    target_virtual_users: int = 0
    simulated_users: int = 0
    persona_counts: Dict[str, int] = Field(default_factory=dict)
    outcomes: Dict[str, int] = Field(default_factory=dict)
    overload_probability: float = 0.0
    chaos: ChaosInjectionConfig = Field(default_factory=ChaosInjectionConfig)
    verdict: CriticalJourneyVerdict = Field(default_factory=CriticalJourneyVerdict)
    sample_citizens: List[VirtualCitizen] = Field(default_factory=list)

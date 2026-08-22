"""
NIRANTAR Module 0: Foundation & Digital-Twin Environment
========================================================
Synthetic Public-Service Digital Twin & Mock Ecosystem.

Exports core models, database engine, mock services, dependency graph,
telemetry emitter, and API routers.
"""

from .models import (
    CitizenProfile,
    Station,
    Train,
    Schedule,
    SeatInventory,
    BookingRequest,
    BookingRecord,
    PaymentTransaction,
    ApplicationRecord,
    TelemetryMetric,
    SecurityEvent,
)
from .database import DigitalTwinDatabase, get_db
from .mock_services import (
    AuthService,
    CitizenProfileService,
    SearchService,
    AvailabilityService,
    ApplicationService,
    BookingService,
    PaymentService,
    NotificationService,
)
from .dependency_graph import ServiceDependencyGraph, default_service_graph
from .telemetry_emitter import (
    TelemetryEmitter,
    TelemetryProfile,
    SimulationScenario,
)
from .railway_api import create_digital_twin_app

__all__ = [
    "CitizenProfile",
    "Station",
    "Train",
    "Schedule",
    "SeatInventory",
    "BookingRequest",
    "BookingRecord",
    "PaymentTransaction",
    "ApplicationRecord",
    "TelemetryMetric",
    "SecurityEvent",
    "DigitalTwinDatabase",
    "get_db",
    "AuthService",
    "CitizenProfileService",
    "SearchService",
    "AvailabilityService",
    "ApplicationService",
    "BookingService",
    "PaymentService",
    "NotificationService",
    "ServiceDependencyGraph",
    "default_service_graph",
    "TelemetryEmitter",
    "TelemetryProfile",
    "SimulationScenario",
    "create_digital_twin_app",
]

"""DHARA — load shedding. Protect auth, inventory, booking, payment."""

from __future__ import annotations

from typing import List, Set

PROTECTED = {"AuthService", "SeatInventoryDB", "BookingEngine", "PaymentGateway", "AvailabilityService"}
SHEDDABLE = {"NotificationDispatcher", "SearchService", "analytics", "recommendations"}


class LoadShedPolicy:
    def features_to_disable(self, overloaded: bool, inventory_critical: bool) -> List[str]:
        disabled: Set[str] = set()
        if overloaded:
            disabled.update({"recommendations", "analytics", "non_critical_refresh"})
        if inventory_critical:
            disabled.update({"SearchService_uncached", "NotificationDispatcher"})
        return sorted(disabled)

    def is_protected(self, service: str) -> bool:
        return service in PROTECTED

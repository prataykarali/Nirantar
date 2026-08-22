"""Walk one virtual citizen through a booking-shaped journey."""

from __future__ import annotations

from typing import Tuple

from contracts.orchestration import OrchestrationDecision
from contracts.simulation import CitizenOutcome, JourneyStep, PersonaKind, VirtualCitizen
from m0_digital_twin.railway_api import DigitalTwinRouter
from orchestrator.decision_engine.engine import DharaEngine
from security.gateway import KavachGateway

KAVACH_ENDPOINT = {
    JourneyStep.OPEN: "HOME",
    JourneyStep.SEARCH: "SEARCH",
    JourneyStep.THINK: "SEARCH",
    JourneyStep.RESULTS: "RESULTS",
    JourneyStep.SELECT: "SELECT",
    JourneyStep.AUTHENTICATE: "SELECT",
    JourneyStep.BOOK: "BOOK",
    JourneyStep.PAYMENT: "BOOK",
    JourneyStep.CONFIRMATION: "BOOK",
    JourneyStep.ABANDON: "HOME",
}

CRITICAL_STEPS = {JourneyStep.BOOK, JourneyStep.PAYMENT, JourneyStep.CONFIRMATION}


class JourneyWalker:
    """Tool-shaped steps against the mock railway + Kavach + Dhara."""

    def __init__(
        self,
        router: DigitalTwinRouter,
        kavach: KavachGateway,
        dhara: DharaEngine,
    ) -> None:
        self.router = router
        self.kavach = kavach
        self.dhara = dhara

    def walk(
        self,
        citizen: VirtualCitizen,
        overload_probability: float,
        persist_bookings: bool = False,
    ) -> Tuple[CitizenOutcome, OrchestrationDecision]:
        queued = False
        throttled = False
        completed = 0
        last_decision: OrchestrationDecision | None = None
        is_retry = citizen.persona in {PersonaKind.RETRY_HEAVY, PersonaKind.TATKAL_RUSH}
        is_bot = citizen.persona in {PersonaKind.SUSPICIOUS, PersonaKind.BOT_SCALPER}

        for step in citizen.journey:
            if step == JourneyStep.THINK:
                completed += 1
                continue
            if step == JourneyStep.ABANDON:
                return self._outcome(citizen, "abandoned", completed, queued, throttled), last_decision

            endpoint = KAVACH_ENDPOINT[step]
            assessment, allowed, reason = self.kavach.evaluate(
                citizen.user_id,
                endpoint,
                ip_hash=citizen.ip_hash,
                is_retry=is_retry and step == JourneyStep.BOOK,
            )
            last_decision = self.dhara.decide(
                assessment=assessment,
                overload_probability=overload_probability,
                endpoint=endpoint,
                session_id=citizen.user_id,
            )
            if not allowed or is_bot:
                throttled = True
                if is_bot:
                    return self._outcome(citizen, "throttled", completed, queued, True), last_decision
                if step in CRITICAL_STEPS:
                    return self._outcome(citizen, "dropped", completed, queued, True), last_decision
                continue
            if last_decision.queue.should_enqueue and step in CRITICAL_STEPS:
                queued = True
            if persist_bookings and step in CRITICAL_STEPS:
                status = self._hit_backend(step, citizen)
                if status >= 500:
                    return self._outcome(citizen, "failed_chaos", completed, queued, throttled), last_decision
            completed += 1

        outcome = self._final_outcome(citizen, queued, throttled)
        return self._outcome(citizen, outcome, completed, queued, throttled), last_decision

    def _hit_backend(self, step: JourneyStep, citizen: VirtualCitizen) -> int:
        if step != JourneyStep.BOOK:
            return 200
        res = self.router.handle_request(
            "POST",
            "/api/v0/booking/initiate",
            {
                "citizen_id": citizen.user_id,
                "train_no": "12301",
                "travel_date": "2026-08-22",
                "class_type": "SL",
                "quota": "GN",
                "source": "HWH",
                "destination": "NDLS",
                "passengers": [{"name": "P***", "age": 30, "gender": "M"}],
            },
        )
        return int(res.get("status", 500))

    def _final_outcome(self, citizen: VirtualCitizen, queued: bool, throttled: bool) -> str:
        if citizen.persona == PersonaKind.ABANDONED:
            return "abandoned"
        if queued:
            return "queued"
        if throttled and citizen.persona in {PersonaKind.SUSPICIOUS, PersonaKind.BOT_SCALPER}:
            return "throttled"
        if JourneyStep.CONFIRMATION in citizen.journey or JourneyStep.BOOK in citizen.journey:
            if citizen.persona == PersonaKind.SEARCH_HEAVY:
                return "completed"
            return "completed"
        return "completed"

    def _outcome(
        self,
        citizen: VirtualCitizen,
        outcome: str,
        steps: int,
        queued: bool,
        throttled: bool,
    ) -> CitizenOutcome:
        return CitizenOutcome(
            user_id=citizen.user_id,
            persona=citizen.persona,
            outcome=outcome,
            steps_completed=steps,
            queued=queued,
            throttled=throttled,
        )


def overload_probability(users: int, db_slow: bool = False, outage: bool = False, cpu: bool = False) -> float:
    """Map concurrent VUs + chaos onto a 0–1 overload signal for DHARA."""
    p = users / 12000.0
    if cpu:
        p += 0.12
    if db_slow:
        p += 0.20
    if outage:
        p += 0.25
    return round(min(0.99, max(0.02, p)), 4)

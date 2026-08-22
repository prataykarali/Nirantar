"""
NIRANTAR Module 4 — Resilient Action Dispatcher
==============================================
Performs 3-Tier validation (Allowlist -> Kavach Security Verdict -> Circuit Breaker State)
before routing execution calls to target backend domain handlers or Digital Twin fallback cache.
"""

from typing import Any, Dict, Optional
import time

from backend.app.services.executor.allowlist import ActionAllowlist
from backend.app.services.executor.circuit_breaker import CircuitBreaker, CircuitState
from security.gateway import KavachGateway
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine
from backend.app.core.runtime import twin
from m0_digital_twin.database import get_db


class ActionDispatcher:
    """
    3-Tier Validated Action Dispatcher.

    Validation Pipeline:
      - Tier 1: Action Allowlist (Strict permitted action enforcement)
      - Tier 2: Kavach Security Verdict (Risk score & access control evaluation)
      - Tier 3: Circuit Breaker State (CLOSED -> Direct execution, OPEN -> Digital Twin Fallback)
    """

    def __init__(
        self,
        allowlist: Optional[ActionAllowlist] = None,
        kavach: Optional[KavachGateway] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
    ) -> None:
        self.allowlist = allowlist or ActionAllowlist()
        self.kavach = kavach or KavachGateway()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()
        self.journey_engine = ProgressiveJourneyEngine()

    def dispatch(
        self,
        action: str,
        payload: Optional[Dict[str, Any]] = None,
        session_id: str = "SESS-LOCAL-001",
        ip_hash: str = "ip_hash_local",
        is_retry: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute an action through 3-tier validation pipeline.
        """
        payload = payload or {}
        clean_action = (action or "").strip().lower()

        # Tier 1: Action Allowlist Validation
        is_allowed, allow_context = self.allowlist.validate_action(clean_action)
        if not is_allowed:
            return self._build_allowlist_error_response(action, allow_context)

        # Tier 2: Kavach Security Verdict Validation
        endpoint_path = f"/api/v1/executor/dispatch/{clean_action}"
        assessment, sec_allowed, sec_reason = self.kavach.evaluate(
            session_id=session_id,
            endpoint=endpoint_path,
            ip_hash=ip_hash,
            is_retry=is_retry,
        )

        verdict_val = assessment.decision.verdict.value if hasattr(assessment.decision.verdict, "value") else str(assessment.decision.verdict)
        threat_cat_val = assessment.decision.threat_category.value if hasattr(assessment.decision.threat_category, "value") else str(assessment.decision.threat_category)

        if not sec_allowed or verdict_val in ("BLOCK", "QUEUE_ISOLATE"):
            return self._build_security_error_response(clean_action, sec_reason, verdict_val, threat_cat_val, assessment.decision.threat_score)

        security_validation_meta = {
            "passed": True,
            "verdict": verdict_val,
            "threat_category": threat_cat_val,
            "threat_score": assessment.decision.threat_score,
            "reason": sec_reason,
        }

        # Tier 3: Circuit Breaker State & Domain Dispatch
        if not self.circuit_breaker.can_execute():
            fallback_res = self.circuit_breaker.execute_fallback(clean_action, payload)
            fallback_res["tier_validations"] = {
                "allowlist": {"passed": True},
                "security": security_validation_meta,
                "circuit_breaker": {
                    "passed": False,
                    "state": self.circuit_breaker.state.value,
                    "action_taken": "FALLBACK_DISPATCHED",
                },
            }
            fallback_res["success"] = True
            return fallback_res

        try:
            domain_result = self._execute_domain_handler(clean_action, payload)
            self.circuit_breaker.record_success()

            return {
                "status": 200,
                "success": True,
                "action": clean_action,
                "fallback_served": False,
                "circuit_breaker_state": self.circuit_breaker.state.value,
                "tier_validations": {
                    "allowlist": {"passed": True},
                    "security": security_validation_meta,
                    "circuit_breaker": {"passed": True, "state": self.circuit_breaker.state.value},
                },
                "result": domain_result,
            }

        except Exception as exc:
            err_str = str(exc).lower()
            is_timeout = "timeout" in err_str or isinstance(exc, TimeoutError)
            self.circuit_breaker.record_failure(is_timeout=is_timeout, reason=str(exc))

            fallback_res = self.circuit_breaker.execute_fallback(clean_action, payload)
            fallback_res["tier_validations"] = {
                "allowlist": {"passed": True},
                "security": security_validation_meta,
                "circuit_breaker": {
                    "passed": False,
                    "state": self.circuit_breaker.state.value,
                    "action_taken": "FALLBACK_DISPATCHED_ON_FAILURE",
                    "execution_error": str(exc),
                },
            }
            fallback_res["success"] = True
            return fallback_res

    def _build_allowlist_error_response(self, action: str, allow_context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": 400,
            "success": False,
            "action": action,
            "tier_failed": "ALLOWLIST",
            "error_code": allow_context.get("error_code", "ACTION_NOT_ALLOWLISTED"),
            "message": allow_context.get("reason", "Action not allowed"),
            "tier_validations": {
                "allowlist": {"passed": False, "details": allow_context},
                "security": {"passed": None},
                "circuit_breaker": {"passed": None},
            },
            "fallback_served": False,
        }

    def _build_security_error_response(
        self,
        clean_action: str,
        sec_reason: str,
        verdict_val: str,
        threat_cat_val: str,
        threat_score: float,
    ) -> Dict[str, Any]:
        return {
            "status": 403,
            "success": False,
            "action": clean_action,
            "tier_failed": "KAVACH_SECURITY",
            "error_code": "SECURITY_VERDICT_REJECTED",
            "message": f"Kavach Security Gateway rejected action '{clean_action}': {sec_reason}",
            "tier_validations": {
                "allowlist": {"passed": True},
                "security": {
                    "passed": False,
                    "verdict": verdict_val,
                    "threat_category": threat_cat_val,
                    "threat_score": threat_score,
                    "reason": sec_reason,
                },
                "circuit_breaker": {"passed": None},
            },
            "fallback_served": False,
        }

    def _handle_search_train(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        source = payload.get("source", "NDLS")
        destination = payload.get("destination", "HWH")
        trains = twin.search.search_routes(source, destination)
        return {
            "source": source,
            "destination": destination,
            "count": len(trains),
            "trains": trains,
        }

    def _handle_filter_results(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        results = payload.get("results", [])
        class_type = payload.get("class_type")
        quota = payload.get("quota")
        max_fare = payload.get("max_fare")

        filtered = results if isinstance(results, list) else []
        if class_type and isinstance(results, list):
            filtered = [t for t in filtered if isinstance(t, dict) and t.get("class_type") == class_type]
        if quota and isinstance(results, list):
            filtered = [t for t in filtered if isinstance(t, dict) and t.get("quota") == quota]
        if max_fare is not None and isinstance(results, list):
            filtered = [t for t in filtered if isinstance(t, dict) and t.get("fare", 0) <= max_fare]

        return {
            "total_input": len(results) if isinstance(results, list) else 0,
            "total_filtered": len(filtered),
            "filtered_results": filtered,
        }

    def _handle_focus_element(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        element_id = payload.get("element_id", "source-station-input")
        step_name = payload.get("step_name", "INTENT")
        return {
            "focused_element_id": element_id,
            "step_name": step_name,
            "focus_applied": True,
            "aria_label": f"Focus active on {element_id}",
        }

    def _handle_prepare_autofill(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        user_data = payload.get("user_data")
        safe_autofill = self.journey_engine.get_safe_autofill_data(user_data)
        return safe_autofill.model_dump() if hasattr(safe_autofill, "model_dump") else safe_autofill.dict()

    def _handle_explain_payment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        method = payload.get("method", "UPI")
        lang = payload.get("language", "en")
        return {
            "payment_method": method,
            "language": lang,
            "explanation": f"Payment via {method} is protected under zero-PII tokenization with automatic failure recovery.",
            "recommended_action": "Use instant UPI or Saved Card token for high-concurrency booking windows.",
        }

    def _handle_check_payment_status(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = get_db()
        booking_id = payload.get("booking_id", "BKG-0001")
        conn = db._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM payments WHERE booking_id = ?", (booking_id,))
        row = cur.fetchone()
        if row:
            return dict(row)
        return {
            "booking_id": booking_id,
            "status": "PROCESSING",
            "payment_gateway": "SYNTHETIC_SBI_GATEWAY",
            "message": "Payment processing in progress.",
        }

    def _execute_domain_handler(self, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Route to target domain handler implementation."""
        domain_handlers = {
            "search_train": self._handle_search_train,
            "filter_results": self._handle_filter_results,
            "focus_element": self._handle_focus_element,
            "prepare_autofill": self._handle_prepare_autofill,
            "explain_payment": self._handle_explain_payment,
            "check_payment_status": self._handle_check_payment_status,
        }

        handler = domain_handlers.get(action)
        if handler is None:
            raise ValueError(f"No domain handler registered for action '{action}'")

        return handler(payload)


# Singleton instance for central dispatching
dispatcher = ActionDispatcher()

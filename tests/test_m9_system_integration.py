"""
NIRANTAR Module 9 — System Integration & Repository Prober Test Suite
======================================================================
Validates:
  1. System API Endpoints: `/api/v1/system/health`, `/version`, `/audit-summary`.
  2. Full System Integration Flow across M1 through M8 (Civic Journey -> Predictive
     Intelligence -> Kavach Security -> Action Executor -> Grounded Search ->
     Prayog Chaos -> Command Center / Dhara -> Frontend Integration).
  3. Zero-PII Safety Boundary & Hard Grounded Data Invariants.
  4. Code Quality & Anti-Hardcoding Auditor Verification for system API module.
"""

import base64
import os
import sys
from pathlib import Path
from typing import Dict, Any

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine, JourneyStage
from backend.app.services.citizen.autofill import SafeAutofillEngine
from backend.app.services.command_center.orchestrator import CommandCenterOrchestrator
from backend.app.services.executor.dispatcher import ActionDispatcher
from backend.app.services.executor.allowlist import ActionAllowlist
from backend.app.adapters.search.grounding import GroundedFactVerifier
from security.gateway import KavachGateway
from contracts.citizen import CitizenIntent, IntentType, CitizenSession
from contracts.telemetry import TelemetryEvent
from backend.app.services.prediction.predictor import UnifiedPredictiveService

import importlib.util

REPO_ROOT = Path(__file__).resolve().parents[1]

# Dynamically import code quality evaluators from hyphenated directory code-quality-agents
_auditor_spec = importlib.util.spec_from_file_location(
    "anti_hardcoding_auditor",
    REPO_ROOT / "code-quality-agents" / "evals" / "anti_hardcoding_auditor.py"
)
_anti_hardcoding_mod = importlib.util.module_from_spec(_auditor_spec)
_auditor_spec.loader.exec_module(_anti_hardcoding_mod)
AntiHardcodingAuditor = _anti_hardcoding_mod.AntiHardcodingAuditor

_reviewer_spec = importlib.util.spec_from_file_location(
    "code_quality_reviewer",
    REPO_ROOT / "code-quality-agents" / "evals" / "code_quality_reviewer.py"
)
_code_quality_mod = importlib.util.module_from_spec(_reviewer_spec)
_reviewer_spec.loader.exec_module(_code_quality_mod)
analyze_file = _code_quality_mod.analyze_file


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# =====================================================================
# 1. System API Endpoints Tests
# =====================================================================

def test_system_health_endpoint(client: TestClient) -> None:
    """Verify /api/v1/system/health returns complete module status for M0-M8."""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == 200
    assert data["health"] == "healthy"
    assert data["service"] == "NIRANTAR Platform"
    assert data["version"] == "0.1.0"
    assert data["mode"] == "local-first"
    assert data["zero_pii_enforced"] is True
    assert data["data_grounding_active"] is True

    modules = data["modules"]
    expected_modules = [
        "M0_digital_twin",
        "M1_civic_journey",
        "M2_predictive_intelligence",
        "M3_kavach_security",
        "M4_action_executor",
        "M5_grounded_search",
        "M6_prayog_chaos",
        "M7_command_center",
        "M8_frontend_integration",
    ]

    for mod in expected_modules:
        assert mod in modules, f"Missing status for module '{mod}'"
        assert modules[mod]["status"] == "healthy"
        assert modules[mod]["ready"] is True


def test_system_version_endpoint(client: TestClient) -> None:
    """Verify /api/v1/system/version and /version return platform version and safety invariants."""
    # Test primary router endpoint
    res_primary = client.get("/api/v1/system/version")
    assert res_primary.status_code == 200

    data = res_primary.json()
    assert data["status"] == 200
    assert data["version"] == "0.1.0"
    assert "NIRANTAR" in data["platform"]
    assert "Local-First" in data["architecture"]
    assert len(data["modules_active"]) >= 9
    assert len(data["safety_invariants"]) >= 4

    # Test alias endpoint
    res_alias = client.get("/version")
    assert res_alias.status_code == 200
    assert res_alias.json()["version"] == "0.1.0"


def test_system_audit_summary_endpoint(client: TestClient) -> None:
    """Verify /api/v1/system/audit-summary and /audit-summary return aggregated metrics."""
    res_primary = client.get("/api/v1/system/audit-summary")
    assert res_primary.status_code == 200

    data = res_primary.json()
    assert data["status"] == 200

    sec = data["security_audit"]
    assert sec["zero_pii_violations"] == 0
    assert sec["rate_limiter_active"] is True
    assert sec["trust_classifier_active"] is True

    exec_audit = data["execution_audit"]
    assert exec_audit["circuit_breaker_state"] in ["CLOSED", "HALF_OPEN", "OPEN"]

    dhara = data["dhara_self_healing"]
    assert dhara["load_shedding_level"] in [0, 1, 2, 3]
    assert dhara["auto_healing_enabled"] is True

    boundaries = data["safety_boundaries"]
    assert boundaries["zero_pii_safety_boundary"] == "ENFORCED"
    assert boundaries["hard_grounded_data_invariants"] == "VERIFIED"
    assert boundaries["hardcoding_violations_detected"] == 0

    # Test alias endpoint
    res_alias = client.get("/audit-summary")
    assert res_alias.status_code == 200
    assert res_alias.json()["status"] == 200


# =====================================================================
# 2. Full System Integration Flow across M1 through M8
# =====================================================================

def test_full_system_integration_flow_m1_to_m8() -> None:
    """
    Executes complete end-to-end integration pipeline validating interaction
    across Modules M1 through M8 in sequence:
      M1 (Civic Intent) -> M2 (Predictive Intelligence) -> M3 (Kavach Security)
      -> M4 (Action Executor) -> M5 (Grounded Search) -> M6 (Prayog Chaos)
      -> M7 (Command Center / Dhara) -> M8 (Frontend / Stepper / Voice / Safe Autofill)
    """

    # --- M1: Civic Journey & Multilingual Intent Extraction ---
    intent_extractor = MultilingualIntentExtractor()
    query_text = "Howrah to New Delhi train booking tomorrow for 2 passengers"
    intent: CitizenIntent = intent_extractor.extract_intent(query_text, language="en")

    assert intent.intent_type in [IntentType.BOOK_TRAIN, IntentType.SEARCH_TRAINS]
    assert intent.source_station in ["HWH", "SDAH"]
    assert intent.destination_station == "NDLS"

    # --- M2: Predictive Intelligence ---
    predictor = UnifiedPredictiveService()
    telemetry = TelemetryEvent(
        service_name="BookingEngine",
        concurrent_users=500,
        requests_per_sec=200.0,
        cpu_percent=45.0,
        ram_percent=55.0,
    )
    prediction = predictor.predict_telemetry_event(telemetry)
    assert prediction.target_service == "BookingEngine"
    assert prediction.forecast.overload_probability >= 0.0

    # --- M3: Kavach Security Gateway ---
    kavach = KavachGateway()
    raw_payload = {
        "user_name": "Rajesh Kumar",
        "phone": "+919876543210",
        "aadhaar": "1234-5678-9012",
        "credit_card": "4111-2222-3333-4444",
        "action": "BOOK_TICKET",
    }
    assessment, allowed, reason = kavach.evaluate(session_id="sys_test_001", endpoint="/api/v1/booking/initiate")
    assert allowed is True

    sanitized = kavach.sanitize(raw_payload)
    assert sanitized["user_name"] != "Rajesh Kumar"  # Masked
    assert "4111-2222-3333-4444" not in str(sanitized)

    # --- M4: Action Executor Guard ---
    executor = ActionDispatcher()
    execution_result = executor.dispatch(
        action="search_train",
        payload={"source": "HWH", "destination": "NDLS"},
        session_id="sys_test_001",
    )
    assert execution_result["success"] is True
    assert execution_result["circuit_breaker_state"] == "CLOSED"

    # --- M5: Grounded Search Verification ---
    grounder = GroundedFactVerifier()
    verification = grounder.verify_llm_output(
        llm_output="Train 12301 Rajdhani Express from HWH to NDLS is AVAILABLE.",
        query="12301 Rajdhani Express",
    )
    assert verification.is_grounded is True
    assert len(verification.ungrounded_claims) == 0

    # --- M6: Prayog Chaos & System Resilience ---
    cmd_center = CommandCenterOrchestrator()
    snap_before = cmd_center.snapshot()
    assert snap_before.live.requests_per_sec >= 0.0

    # --- M7: Command Center & Dhara Self-Healing ---
    dhara_status = cmd_center.dhara.get_status()
    assert dhara_status["level"] == 0
    assert dhara_status["auto_healing_enabled"] is True

    # --- M8: Frontend Integration & Voice / Stepper / Autofill ---
    voice_adapter = VoiceInterfaceAdapter(intent_extractor)
    audio_pcm = b"RIFF" + b"\x00" * 40
    audio_b64 = base64.b64encode(audio_pcm).decode("utf-8")
    transcription = voice_adapter.transcribe_audio_base64(audio_b64, language_hint="en")
    assert transcription["confidence"] > 0.0

    journey_engine = ProgressiveJourneyEngine()
    session = CitizenSession(preferred_language="en")
    stepper_res = journey_engine.advance_journey(intent, session, JourneyStage.CONFIRM, {"confirmed": True})
    assert stepper_res.payload["stage"] in [JourneyStage.SELECT.value, JourneyStage.SEARCH.value, JourneyStage.CONFIRM.value]

    autofill_engine = SafeAutofillEngine()
    safe_payload = autofill_engine.prepare_autofill({
        "name": "Suresh Gupta",
        "age": 35,
        "password": "Password123!",
        "otp": "654321",
    })
    assert safe_payload.safe_data["name"] == "Suresh Gupta"
    assert "password" not in safe_payload.safe_data
    assert "otp" not in safe_payload.safe_data


# =====================================================================
# 3. Zero-PII Safety Boundary & Hard Grounded Data Invariants Tests
# =====================================================================

def test_zero_pii_safety_boundary_enforcement(client: TestClient) -> None:
    """Verify zero PII fields are leaked across API sanitization and autofill boundaries."""
    sensitive_payload = {
        "user_data": {
            "name": "Ananya Roy",
            "age": 29,
            "gender": "F",
            "phone": "+919988776655",
            "password": "SuperSecretPassword#2026",
            "cvv": "888",
            "pin": "1234",
            "otp": "999999",
            "aadhaar": "9999-8888-7777",
            "auth_token": "bearer_secret_12345",
        }
    }

    # Test API endpoint
    response = client.post("/api/v1/citizen/autofill/safe-fields", json=sensitive_payload)
    assert response.status_code == 200

    data = response.json()
    safe_data = data["safe_data"]
    filtered_out = data["filtered_out_fields"]

    # Verify safe fields preserved
    assert safe_data.get("name") == "Ananya Roy" or safe_data.get("Name") == "Ananya Roy"

    # Verify forbidden sensitive credentials completely absent from safe_data
    forbidden_keys = ["password", "cvv", "pin", "otp", "aadhaar", "auth_token"]
    for fkey in forbidden_keys:
        assert fkey not in safe_data, f"Forbidden key '{fkey}' found in safe_data!"
        assert fkey in filtered_out, f"Forbidden key '{fkey}' not listed in filtered_out!"


def test_hard_grounded_data_invariants(client: TestClient) -> None:
    """Verify system responses contain strictly grounded real-time backend state."""
    # Test telemetry endpoint returns dynamic calculated aggregated state
    res_telem = client.get("/api/v1/telemetry/snapshot")
    assert res_telem.status_code == 200
    telem_data = res_telem.json()
    assert telem_data["status"] == 200
    assert "data" in telem_data

    # Test audit summary endpoint returns actual zero violation invariant
    res_audit = client.get("/api/v1/system/audit-summary")
    assert res_audit.status_code == 200
    audit_data = res_audit.json()
    assert audit_data["safety_boundaries"]["hardcoding_violations_detected"] == 0


# =====================================================================
# 4. Automated Code Quality & Anti-Hardcoding Audits
# =====================================================================

def test_system_module_code_quality_and_anti_hardcoding_audits() -> None:
    """Run anti-hardcoding auditor and code quality reviewer against backend/app/api/system.py."""
    system_file_path = REPO_ROOT / "backend" / "app" / "api" / "system.py"
    assert system_file_path.exists(), f"system.py file missing: {system_file_path}"

    # 1. Anti-Hardcoding Audit Scan
    auditor = AntiHardcodingAuditor(str(REPO_ROOT))
    critical_violations = auditor.audit()
    assert critical_violations == 0, f"Anti-hardcoding scan found {critical_violations} CRITICAL violations."

    # 2. Code Quality Reviewer AST Scan
    analysis_result = analyze_file(system_file_path)
    issues = analysis_result["issues"]
    must_issues = [issue for issue in issues if issue.get("severity") == "must"]

    assert len(must_issues) == 0, f"Code Quality Reviewer found blocking issues in system.py: {must_issues}"

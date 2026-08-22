"""
Unit Tests for NIRANTAR Contracts & LLM Adapter Layer
=====================================================
Validates Pydantic schema validation, restricted tool registry, and offline LLM fallback.
"""

import pytest
from contracts.citizen import CitizenIntent, IntentType, CitizenJourneyRequest
from contracts.telemetry import TelemetryEvent, DerivedTelemetryFeatures
from contracts.prediction import PredictionResult, OverloadForecast, AnomalyDetectionResult, ModelType, FeatureImportance
from contracts.security import ThreatDecision, SecurityAssessment, AccessControlVerdict, ThreatCategory
from contracts.orchestration import OrchestrationDecision, ResilienceState, QueueAction, LoadShedAction
from contracts.simulation import SimulationScenarioConfig, WorkloadProfile, WorkloadType
from contracts.experiment import ExperimentResult, BenchmarkMetrics
from backend.app.adapters.llm.tools import get_tool_registry
from backend.app.adapters.llm.base import BaseLLMProvider


class MockProvider(BaseLLMProvider):
    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        return self.deterministic_fallback_extract(query, language)

    def explain_prediction(self, prediction: PredictionResult) -> str:
        return "Explanation"


def test_citizen_intent_validation() -> None:
    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date="2026-08-22",
        quota="TQ",
        confidence=0.95,
    )
    assert intent.intent_type == IntentType.BOOK_TRAIN
    assert intent.quota == "TQ"
    assert intent.confidence == 0.95


def test_telemetry_contracts() -> None:
    evt = TelemetryEvent(
        service_name="BookingEngine",
        requests_per_sec=12500.0,
        concurrent_users=140000,
        cpu_percent=92.5,
        ram_percent=84.0,
        latency_p99_ms=1150.0,
        error_rate=0.12,
    )
    assert evt.service_name == "BookingEngine"
    assert evt.cpu_percent == 92.5
    assert evt.error_rate == 0.12


def test_prediction_and_shap_contracts() -> None:
    pred = PredictionResult(
        target_service="BookingEngine",
        model_type=ModelType.XGBOOST,
        forecast=OverloadForecast(
            target_service="BookingEngine",
            overload_probability=0.88,
            predicted_peak_rps=16000.0,
        ),
        anomaly=AnomalyDetectionResult(is_anomaly=True, anomaly_score=0.82),
        top_shap_factors=[
            FeatureImportance(feature_name="concurrent_users", shap_value=0.45, percentage_contribution=43.0),
            FeatureImportance(feature_name="cpu_percent", shap_value=0.28, percentage_contribution=27.0),
        ],
    )
    assert pred.forecast.overload_probability == 0.88
    assert len(pred.top_shap_factors) == 2
    assert pred.top_shap_factors[0].feature_name == "concurrent_users"


def test_security_verdicts() -> None:
    assessment = SecurityAssessment(
        session_id="SES-001",
        ip_hash="ip_hash_abc",
        decision=ThreatDecision(
            verdict=AccessControlVerdict.THROTTLE,
            threat_category=ThreatCategory.AUTOMATED_BOT,
            threat_score=0.89,
            throttle_rate_rps=2.0,
        ),
        risk_factors=["High query frequency (50 req/s)", "No browser fingerprint"],
    )
    assert assessment.decision.verdict == AccessControlVerdict.THROTTLE
    assert assessment.decision.threat_category == ThreatCategory.AUTOMATED_BOT
    assert len(assessment.risk_factors) == 2


def test_orchestration_decision() -> None:
    decision = OrchestrationDecision(
        target_service="BookingEngine",
        current_state=ResilienceState.QUEUE_ACTIVATED,
        queue=QueueAction(should_enqueue=True, priority_level=1),
        load_shed=LoadShedAction(shed_non_critical=True, drop_unauthenticated=True),
        database_protection_enabled=True,
    )
    assert decision.current_state == ResilienceState.QUEUE_ACTIVATED
    assert decision.queue.should_enqueue is True
    assert decision.load_shed.drop_unauthenticated is True


def test_restricted_tool_registry() -> None:
    registry = get_tool_registry()
    tools = registry.get_tool_definitions()
    tool_names = [t["name"] for t in tools]
    assert "search_service" in tool_names
    assert "query_local_db" in tool_names
    assert "search_apify" in tool_names
    assert "check_inventory" in tool_names
    assert "list_stations" in tool_names

    # Test safe tool execution
    stations_res = registry.call_tool("list_stations")
    assert len(stations_res) >= 10

    # Test unknown tool rejection
    err_res = registry.call_tool("unauthorized_exec_python")
    assert "error" in err_res


def test_deterministic_offline_llm_fallback() -> None:
    provider = MockProvider()

    # Query 1: Hindi/Hinglish search
    q1 = "Mujhe Howrah se New Delhi train search karni hai"
    intent1 = provider.extract_intent(q1, "hi")
    assert intent1.source_station == "HWH"
    assert intent1.destination_station == "NDLS"
    assert intent1.intent_type == IntentType.SEARCH_TRAINS

    # Query 2: Tatkal booking intent
    q2 = "Book Tatkal ticket from Kolkata to Delhi tomorrow"
    intent2 = provider.extract_intent(q2, "en")
    assert intent2.quota == "TQ"
    assert intent2.intent_type == IntentType.BOOK_TRAIN

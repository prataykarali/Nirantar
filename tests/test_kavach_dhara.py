"""KAVACH trust scoring and DHARA admission decisions."""

from security.detection.profiler import SessionProfiler
from security.detection.classifier import TrustClassifier
from security.gateway import KavachGateway
from security.privacy.masking import mask_name, mask_phone
from orchestrator.decision_engine.engine import DharaEngine
from contracts.orchestration import ResilienceState


def test_human_path_is_allowed() -> None:
    profiler = SessionProfiler()
    clf = TrustClassifier()
    session_id = "SES-human"
    for step in ("HOME", "SEARCH", "RESULTS", "SELECT", "BOOK"):
        profiler.record(session_id, step)
    profile = profiler.record(session_id, "BOOK")
    assessment = clf.assess(profile)
    assert assessment.decision.threat_score < 0.3
    assert assessment.decision.verdict.value == "ALLOW"


def test_bot_like_repeat_search_raises_risk() -> None:
    profiler = SessionProfiler()
    clf = TrustClassifier()
    session_id = "SES-bot"
    for _ in range(8):
        profiler.record(session_id, "SEARCH")
    profile = profiler._sessions[session_id]
    score, factors, _category = clf.score(profile)
    assert score >= 0.3
    assert any("repeat" in f or "frequency" in f or "burst" in f for f in factors)
    verdict, rps = clf.verdict_for(score)
    if score < 0.6:
        assert verdict.value == "ALLOW"
        assert rps == 10.0
    elif score < 0.8:
        assert rps == 2.0
    else:
        assert rps <= 0.5


def test_kavach_does_not_auto_block_moderate_risk() -> None:
    clf = TrustClassifier()
    verdict, _rps = clf.verdict_for(0.45)
    assert verdict.value == "ALLOW"


def test_kavach_gateway_records_audit() -> None:
    gw = KavachGateway()
    assessment, allowed, reason = gw.evaluate("SES-1", "SEARCH")
    assert allowed is True
    assert reason in {"allow", "monitor", "challenge", "throttled"}
    assert assessment.decision.threat_score >= 0.0
    assert gw.audit.recent(1)


def test_pii_masking() -> None:
    assert mask_name("Asha Kumar").startswith("A")
    assert "***" in mask_name("Asha Kumar")
    assert mask_phone("9876543210").endswith("3210")


def test_dhara_activates_queue_on_overload() -> None:
    engine = DharaEngine()
    decision = engine.decide(overload_probability=0.87, suspicious_sessions=1100, endpoint="BOOK")
    assert decision.current_state in {
        ResilienceState.QUEUE_ACTIVATED,
        ResilienceState.LOAD_SHEDDING,
    }
    assert decision.queue.should_enqueue is True
    assert decision.database_protection_enabled is True
    dump = engine.dump(decision)
    assert "BookingEngine" in dump["critical_path"] or dump["critical_path"]


def test_dhara_priority_booking_over_search() -> None:
    engine = DharaEngine()
    engine.decide(overload_probability=0.8, endpoint="SEARCH", session_id="s1")
    engine.decide(overload_probability=0.8, endpoint="BOOK", session_id="s2")
    admitted = engine.queue.admit(2)
    categories = [item["category"] for item in admitted]
    assert categories[0] == "CRITICAL_BOOKING"
    assert categories[1] == "SEARCH"

"""Semantic orchestration prompt, tools, and DB-first fallback."""

from backend.app.adapters.llm.prompts import SEMANTIC_ORCHESTRATION_PROMPT, SEMANTIC_INTENT_PROMPT, build_system_prompt
from backend.app.adapters.llm.tools import get_tool_registry
from backend.app.adapters.llm.orchestrator import SemanticOrchestrationAgent


def test_system_prompt_contains_timeout_and_tools() -> None:
    prompt = build_system_prompt()
    assert "NVIDIA" in SEMANTIC_ORCHESTRATION_PROMPT
    assert "zero hardcoded keywords" in SEMANTIC_ORCHESTRATION_PROMPT.lower() or "zero hardcoded keywords" in SEMANTIC_ORCHESTRATION_PROMPT
    assert "Invisible Handoffs" in prompt
    assert "query_local_db" in prompt
    assert "search_apify" in prompt
    assert "Timeout" in prompt
    assert "mobile" in prompt.lower()
    assert "BOOK_TRAIN" in SEMANTIC_INTENT_PROMPT


def test_tool_registry_includes_apify_and_db() -> None:
    registry = get_tool_registry()
    names = [t["name"] for t in registry.get_tool_definitions()]
    assert "query_local_db" in names
    assert "search_apify" in names
    routes = registry.call_tool("query_local_db", src="HWH", dst="NDLS")
    assert len(routes) >= 1


def test_orchestrator_uses_local_db_first() -> None:
    agent = SemanticOrchestrationAgent()
    result = agent.answer(
        "I want a train from Howrah to Delhi",
        language="en",
        source_station="HWH",
        destination_station="NDLS",
    )
    assert result.source == "LOCAL_DIGITAL_TWIN"
    assert result.db_hits
    assert "Checking the database" not in result.message
    assert result.message

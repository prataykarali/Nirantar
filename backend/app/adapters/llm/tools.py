"""
NIRANTAR — Restricted LLM Tool Registry
========================================
Defines strict, deterministic tools callable by the LLM.
The LLM CANNOT execute arbitrary Python; it only invokes registered schema-validated functions.
"""

from typing import Any, Callable, Dict, List, Optional
from m0_digital_twin.database import get_db
from m0_digital_twin.mock_services import SearchService, AvailabilityService


def _apify_search(query: str, max_results: int = 3) -> Dict[str, Any]:
    from backend.app.adapters.search.apify_adapter import ApifySearchEngine

    return ApifySearchEngine().search_web(query, max_results=max_results)


TOOL_JSON_SCHEMAS: List[Dict[str, Any]] = [
    {
        "name": "query_local_db",
        "description": "Query the local digital-twin railway database for trains between two stations. Call this BEFORE any web search.",
        "parameters": {
            "type": "object",
            "properties": {
                "src": {"type": "string", "description": "Source station code e.g. HWH"},
                "dst": {"type": "string", "description": "Destination station code e.g. NDLS"},
            },
            "required": ["src", "dst"],
        },
    },
    {
        "name": "search_service",
        "description": "Alias of query_local_db. Search available train routes between source and destination stations.",
        "parameters": {
            "type": "object",
            "properties": {
                "src": {"type": "string", "description": "Source station code e.g. HWH"},
                "dst": {"type": "string", "description": "Destination station code e.g. NDLS"},
            },
            "required": ["src", "dst"],
        },
    },
    {
        "name": "search_apify",
        "description": "Retrieve open-web facts via Apify when the local DB has no complete answer. Never use this to invent fares or seat counts.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Natural-language search query"},
                "max_results": {"type": "integer", "default": 3},
            },
            "required": ["query"],
        },
    },
    {
        "name": "check_inventory",
        "description": "Check seat availability for a specific train and quota in the local inventory DB.",
        "parameters": {
            "type": "object",
            "properties": {
                "train": {"type": "string", "description": "Train number e.g. 12301"},
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "cls": {"type": "string", "default": "3A"},
                "quota": {"type": "string", "default": "GN"},
            },
            "required": ["train", "date"],
        },
    },
    {
        "name": "list_stations",
        "description": "List all supported railway hub stations in the local catalogue.",
        "parameters": {"type": "object", "properties": {}},
    },
]


OPENAI_TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {"type": "function", "function": schema} for schema in TOOL_JSON_SCHEMAS
]


class ToolRegistry:
    """Restricted function registry exposed to LLM intent & conversation pipelines."""

    def __init__(self) -> None:
        self._tools: Dict[str, Callable[..., Any]] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        db = get_db()
        search = SearchService(db)
        avail = AvailabilityService(db)

        self.register("query_local_db", lambda src, dst: search.search_routes(src, dst))
        self.register("search_service", lambda src, dst: search.search_routes(src, dst))
        self.register("list_stations", lambda: search.list_stations())
        self.register(
            "check_inventory",
            lambda train, date, cls="3A", quota="GN": avail.check_availability(train, date, cls, quota),
        )
        self.register("search_apify", lambda query, max_results=3: _apify_search(query, max_results))
        self.register("get_queue_status", lambda queue="booking": {"queue_depth": 0, "status": "DRAINED"})

    def register(self, name: str, func: Callable[..., Any]) -> None:
        self._tools[name] = func

    def call_tool(self, name: str, **kwargs: Any) -> Any:
        """Safely invoke registered tool with parameter unpacking."""
        if name not in self._tools:
            return {"error": f"Tool '{name}' not found in restricted registry"}
        try:
            return self._tools[name](**kwargs)
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Return JSON-schema tool definitions for model function calling."""
        return list(TOOL_JSON_SCHEMAS)

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return list(OPENAI_TOOL_SCHEMAS)


_global_registry: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    global _global_registry
    if _global_registry is None:
        _global_registry = ToolRegistry()
    return _global_registry

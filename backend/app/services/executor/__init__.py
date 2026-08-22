"""
NIRANTAR Module 4 — Action Executor & Resilient Dispatch Core
============================================================
Provides strict action allowlisting, 3-state circuit breaker protection,
digital twin fallback dispatch, and 3-tier validated action routing.
"""

from .allowlist import ActionAllowlist, ActionNotAllowedError
from .circuit_breaker import CircuitBreaker, CircuitState
from .dispatcher import ActionDispatcher

__all__ = [
    "ActionAllowlist",
    "ActionNotAllowedError",
    "CircuitBreaker",
    "CircuitState",
    "ActionDispatcher",
]

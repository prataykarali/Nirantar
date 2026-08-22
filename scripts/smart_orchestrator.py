#!/usr/bin/env python3
"""
AI Agent Company — Smart MoE Orchestrator & Session Manager

The brain of the operation. This script:
1. Decomposes any client query into discrete, estimable sessions
2. Estimates token budgets, time costs, and API quota consumption per session
3. Routes sessions to the optimal agent (MoE) based on task requirements
4. Tracks progress across sessions with append-to-file checkpointing
5. Adapts to any AI model's capabilities (premium Opus → free DeepSeek)
6. Provides "QUOTA-BASED" planning — says exactly what it can do with available resources

Usage:
    python smart_orchestrator.py plan "Build a library search UI with auth"
    python smart_orchestrator.py status
    python smart_orchestrator.py resume --session 3
    python smart_orchestrator.py quota --provider codex --daily-budget 500000
"""

import argparse
import json
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ────────────────────────────────────────────────────────────────────────────
# AI Model Profiles — Token Costs & Capabilities
# ────────────────────────────────────────────────────────────────────────────

MODEL_PROFILES = {
    "claude-opus": {
        "provider": "anthropic",
        "tier": "premium",
        "input_cost_per_1k": 0.015,
        "output_cost_per_1k": 0.075,
        "context_window": 200000,
        "max_output": 4096,
        "speed": "slow",
        "reliability": 0.95,
        "best_for": ["architecture", "complex_reasoning", "security_review", "ux_analysis"],
    },
    "claude-sonnet": {
        "provider": "anthropic",
        "tier": "standard",
        "input_cost_per_1k": 0.003,
        "output_cost_per_1k": 0.015,
        "context_window": 200000,
        "max_output": 4096,
        "speed": "fast",
        "reliability": 0.92,
        "best_for": ["coding", "testing", "code_review", "documentation"],
    },
    "claude-haiku": {
        "provider": "anthropic",
        "tier": "budget",
        "input_cost_per_1k": 0.00025,
        "output_cost_per_1k": 0.00125,
        "context_window": 48000,
        "max_output": 4096,
        "speed": "fastest",
        "reliability": 0.85,
        "best_for": ["simple_tasks", "linting", "file_governance", "quick_checks"],
    },
    "gpt-4o": {
        "provider": "openai",
        "tier": "premium",
        "input_cost_per_1k": 0.005,
        "output_cost_per_1k": 0.015,
        "context_window": 128000,
        "max_output": 4096,
        "speed": "fast",
        "reliability": 0.93,
        "best_for": ["architecture", "complex_coding", "design", "analysis"],
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "tier": "budget",
        "input_cost_per_1k": 0.00015,
        "output_cost_per_1k": 0.0006,
        "context_window": 128000,
        "max_output": 16384,
        "speed": "fast",
        "reliability": 0.88,
        "best_for": ["simple_coding", "testing", "formatting", "quick_wins"],
    },
    "deepseek-coder": {
        "provider": "deepseek",
        "tier": "free",
        "input_cost_per_1k": 0.000,
        "output_cost_per_1k": 0.000,
        "context_window": 32000,
        "max_output": 4096,
        "speed": "medium",
        "reliability": 0.78,
        "best_for": ["coding", "refactoring", "documentation", "simple_tasks"],
    },
    "deepseek-chat": {
        "provider": "deepseek",
        "tier": "free",
        "input_cost_per_1k": 0.000,
        "output_cost_per_1k": 0.000,
        "context_window": 32000,
        "max_output": 4096,
        "speed": "fast",
        "reliability": 0.75,
        "best_for": ["conversation", "planning", "simple_reasoning"],
    },
    "codex": {
        "provider": "openai",
        "tier": "standard",
        "input_cost_per_1k": 0.000,
        "output_cost_per_1k": 0.000,
        "context_window": 128000,
        "max_output": 4096,
        "speed": "fast",
        "reliability": 0.85,
        "best_for": ["coding", "refactoring", "testing", "all_around"],
    },
    "qwen2.5-coder-7b": {
        "provider": "ollama",
        "tier": "local",
        "input_cost_per_1k": 0.000,
        "output_cost_per_1k": 0.000,
        "context_window": 32768,
        "max_output": 2048,
        "speed": "medium",
        "reliability": 0.72,
        "best_for": ["coding", "refactoring", "simple_tasks", "offline_work"],
    },
    "llama3.2-3b": {
        "provider": "ollama",
        "tier": "local",
        "input_cost_per_1k": 0.000,
        "output_cost_per_1k": 0.000,
        "context_window": 8192,
        "max_output": 2048,
        "speed": "fast",
        "reliability": 0.65,
        "best_for": ["quick_checks", "formatting", "simple_classification", "file_warden"],
    },
}

# ────────────────────────────────────────────────────────────────────────────
# Task-to-Agent Routing Rules (MoE)
# ────────────────────────────────────────────────────────────────────────────

TASK_ROUTING_TABLE = {
    # Architecture & Planning
    "system_design": {"agent": "agent1_architect", "model_tier": "premium", "complexity": 0.9},
    "dependency_mapping": {"agent": "agent1_architect", "model_tier": "standard", "complexity": 0.7},
    "api_design": {"agent": "agent1_architect", "model_tier": "standard", "complexity": 0.6},

    # Development
    "code_implementation": {"agent": "agent2_developer", "model_tier": "standard", "complexity": 0.8},
    "refactoring": {"agent": "agent2_developer", "model_tier": "budget", "complexity": 0.5},
    "bug_fixing": {"agent": "agent2_developer", "model_tier": "standard", "complexity": 0.6},

    # ML/LLM
    "prompt_engineering": {"agent": "agent3_ml_specialist", "model_tier": "premium", "complexity": 0.8},
    "token_optimization": {"agent": "agent3_ml_specialist", "model_tier": "budget", "complexity": 0.4},
    "model_selection": {"agent": "agent3_ml_specialist", "model_tier": "standard", "complexity": 0.6},

    # Testing
    "unit_testing": {"agent": "agent4_qa", "model_tier": "budget", "complexity": 0.6},
    "integration_testing": {"agent": "agent4_qa", "model_tier": "standard", "complexity": 0.7},
    "adversarial_testing": {"agent": "agent4_qa", "model_tier": "premium", "complexity": 0.8},

    # Code Review
    "security_audit": {"agent": "agent5_reviewer", "model_tier": "premium", "complexity": 0.9},
    "code_review": {"agent": "agent5_reviewer", "model_tier": "standard", "complexity": 0.7},
    "style_check": {"agent": "agent5_reviewer", "model_tier": "budget", "complexity": 0.3},

    # File Governance
    "file_size_audit": {"agent": "agent6_warden", "model_tier": "budget", "complexity": 0.3},
    "directory_audit": {"agent": "agent6_warden", "model_tier": "budget", "complexity": 0.2},
    "auto_split": {"agent": "agent6_warden", "model_tier": "standard", "complexity": 0.5},

    # UI Design (NEW)
    "design_tokens": {"agent": "agent7_ui_designer", "model_tier": "standard", "complexity": 0.6},
    "component_spec": {"agent": "agent7_ui_designer", "model_tier": "standard", "complexity": 0.7},
    "layout_wireframe": {"agent": "agent7_ui_designer", "model_tier": "standard", "complexity": 0.6},
    "tailwind_config": {"agent": "agent7_ui_designer", "model_tier": "budget", "complexity": 0.4},
    "visual_regression": {"agent": "agent7_ui_designer", "model_tier": "budget", "complexity": 0.3},

    # UX Research (NEW)
    "journey_mapping": {"agent": "agent8_ux_researcher", "model_tier": "premium", "complexity": 0.8},
    "accessibility_audit": {"agent": "agent8_ux_researcher", "model_tier": "standard", "complexity": 0.7},
    "state_coverage": {"agent": "agent8_ux_researcher", "model_tier": "standard", "complexity": 0.6},
    "information_architecture": {"agent": "agent8_ux_researcher", "model_tier": "standard", "complexity": 0.7},
}

# ────────────────────────────────────────────────────────────────────────────
# Session Decomposition Engine
# ────────────────────────────────────────────────────────────────────────────


def classify_task_type(query: str) -> str:
    """Classify a natural language query into a task type from the routing table."""
    q = query.lower()
    if any(kw in q for kw in ["architecture", "design system", "plan", "schema", "overview"]):
        return "system_design"
    if any(kw in q for kw in ["dependency", "graph", "map"]):
        return "dependency_mapping"
    if any(kw in q for kw in ["api", "endpoint", "route", "interface"]):
        return "api_design"
    if any(kw in q for kw in ["implement", "code", "write", "develop", "create", "build"]):
        return "code_implementation"
    if any(kw in q for kw in ["refactor", "restructure", "clean code"]):
        return "refactoring"
    if any(kw in q for kw in ["fix", "bug", "issue", "error", "broken"]):
        return "bug_fixing"
    if any(kw in q for kw in ["prompt", "llm", "model", "token budget"]):
        return "prompt_engineering"
    if any(kw in q for kw in ["test", "qa", "quality", "coverage"]):
        return "unit_testing"
    if any(kw in q for kw in ["security", "audit", "vulnerability", "review"]):
        return "security_audit"
    if any(kw in q for kw in ["ui", "visual", "component", "css", "tailwind", "style"]):
        return "component_spec"
    if any(kw in q for kw in ["ux", "user flow", "journey", "accessibility", "wcag"]):
        return "journey_mapping"
    if any(kw in q for kw in ["file size", "warden", "split", "governance"]):
        return "file_size_audit"
    if any(kw in q for kw in ["design token", "color", "typography", "spacing"]):
        return "design_tokens"
    if any(kw in q for kw in ["layout", "wireframe", "grid", "responsive"]):
        return "layout_wireframe"
    return "code_implementation"


def estimate_task_complexity(task_type: str, description: str) -> float:
    """Estimate task complexity 0.0-1.0 from description length and keywords."""
    base = TASK_ROUTING_TABLE.get(task_type, {}).get("complexity", 0.5)
    word_count = len(description.split())
    length_factor = min(1.0, word_count / 200)
    complexity_keywords = ["complex", "large", "many", "multiple", "distributed",
                          "real-time", "streaming", "concurrent", "async", "scale"]
    keyword_hits = sum(1 for kw in complexity_keywords if kw in description.lower())
    keyword_factor = min(0.3, keyword_hits * 0.05)
    return min(1.0, base + (length_factor * 0.2) + keyword_factor)


def estimate_token_budget(task_type: str, complexity: float) -> Dict[str, int]:
    """Estimate prompt and completion tokens needed for a task."""
    TOKEN_ESTIMATES = {
        "system_design": {"prompt": 2000, "completion": 2500},
        "dependency_mapping": {"prompt": 1500, "completion": 1000},
        "api_design": {"prompt": 1200, "completion": 1500},
        "code_implementation": {"prompt": 2500, "completion": 3000},
        "refactoring": {"prompt": 1800, "completion": 2000},
        "bug_fixing": {"prompt": 1500, "completion": 1200},
        "prompt_engineering": {"prompt": 1000, "completion": 1500},
        "token_optimization": {"prompt": 800, "completion": 1000},
        "model_selection": {"prompt": 600, "completion": 800},
        "unit_testing": {"prompt": 1500, "completion": 2000},
        "integration_testing": {"prompt": 2000, "completion": 2500},
        "adversarial_testing": {"prompt": 1200, "completion": 1500},
        "security_audit": {"prompt": 2000, "completion": 2000},
        "code_review": {"prompt": 2500, "completion": 1500},
        "style_check": {"prompt": 500, "completion": 500},
        "file_size_audit": {"prompt": 300, "completion": 500},
        "directory_audit": {"prompt": 200, "completion": 400},
        "auto_split": {"prompt": 1000, "completion": 1500},
        "design_tokens": {"prompt": 800, "completion": 1200},
        "component_spec": {"prompt": 1200, "completion": 2000},
        "layout_wireframe": {"prompt": 1000, "completion": 1500},
        "tailwind_config": {"prompt": 600, "completion": 800},
        "visual_regression": {"prompt": 400, "completion": 600},
        "journey_mapping": {"prompt": 1500, "completion": 2000},
        "accessibility_audit": {"prompt": 1000, "completion": 1500},
        "state_coverage": {"prompt": 800, "completion": 1200},
        "information_architecture": {"prompt": 1200, "completion": 1500},
    }
    base = TOKEN_ESTIMATES.get(task_type, {"prompt": 1000, "completion": 1000})
    scale = 1.0 + (complexity - 0.5) * 0.5
    return {
        "prompt": int(base["prompt"] * scale),
        "completion": int(base["completion"] * scale),
        "total": int((base["prompt"] + base["completion"]) * scale),
    }


# ────────────────────────────────────────────────────────────────────────────
# Quota & Budget Engine
# ────────────────────────────────────────────────────────────────────────────


def calculate_quota_usage(
    sessions: List[Dict],
    model_name: str = "codex",
    daily_budget_tokens: int = 500000,
) -> Dict[str, Any]:
    """Given a list of sessions, calculate if they fit within daily quota."""
    model = MODEL_PROFILES.get(model_name, MODEL_PROFILES["codex"])
    total_tokens = sum(s["estimated_tokens"]["total"] for s in sessions)
    total_cost = (total_tokens / 1000) * (model["input_cost_per_1k"] + model["output_cost_per_1k"])
    fits_in_quota = total_tokens <= daily_budget_tokens
    sessions_possible = 0
    running_total = 0
    for s in sessions:
        if running_total + s["estimated_tokens"]["total"] <= daily_budget_tokens:
            running_total += s["estimated_tokens"]["total"]
            sessions_possible += 1
        else:
            break
    return {
        "model": model_name,
        "model_tier": model["tier"],
        "total_tokens_needed": total_tokens,
        "daily_budget_tokens": daily_budget_tokens,
        "total_estimated_cost": round(total_cost, 4),
        "fits_in_quota": fits_in_quota,
        "sessions_possible_today": sessions_possible,
        "total_sessions": len(sessions),
        "sessions_remaining_tomorrow": len(sessions) - sessions_possible,
        "quota_utilization_pct": round((total_tokens / daily_budget_tokens) * 100, 1),
        "recommendation": (
            "✅ Full plan fits in today's quota. Proceed."
            if fits_in_quota
            else (
                f"⚠️ Only {sessions_possible}/{len(sessions)} sessions fit today. "
                f"Resume session {sessions_possible + 1} tomorrow."
            )
        ),
    }


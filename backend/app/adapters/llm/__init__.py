"""
NIRANTAR — LLM Provider Factory
================================
Dynamically instantiates configured provider (Ollama, Gemini, OpenAI, or Fallback).
"""

import os
from typing import Optional
from .base import BaseLLMProvider
from .ollama import OllamaProvider
from .cloud_adapters import GeminiProvider, OpenAIProvider, NvidiaNIMProvider
from .tools import ToolRegistry, get_tool_registry
from .orchestrator import SemanticOrchestrationAgent, OrchestrationResult


def get_llm_provider(provider_type: Optional[str] = None) -> BaseLLMProvider:
    """Factory returning active LLM provider based on env or parameter."""
    provider = (provider_type or os.getenv("LLM_PROVIDER", "nvidia")).lower()

    if provider == "nvidia":
        return NvidiaNIMProvider()
    if provider == "gemini":
        return GeminiProvider()
    if provider == "openai":
        return OpenAIProvider()
    # Default is local ₹0 Ollama provider
    return OllamaProvider()


__all__ = [
    "BaseLLMProvider",
    "OllamaProvider",
    "GeminiProvider",
    "OpenAIProvider",
    "ToolRegistry",
    "get_tool_registry",
    "get_llm_provider",
    "SemanticOrchestrationAgent",
    "OrchestrationResult",
]

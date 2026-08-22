# ADR-002: Provider-Agnostic LLM Adapter with Restricted Tools

## Status
Accepted

## Context
Relying on a single proprietary LLM API introduces vendor lock-in, recurring operational cost, and failure modes when API keys expire or rate limits hit during live demonstrations.

## Decision
1. Implement an abstract `BaseLLMProvider` interface with runtime swappable adapters:
   - **Local Default:** `OllamaProvider` (e.g. Qwen 2.5, Llama 3.2, Gemma) at ₹0 cost.
   - **Cloud Adapters (Optional):** `GeminiProvider`, `OpenAIProvider`.
   - **Offline Fallback:** Deterministic rule-based regex extraction when no LLM runtime is available.
2. Restrict LLM capabilities to a sandboxed tool registry (`ToolRegistry`). The LLM cannot execute arbitrary Python; it only formats structured calls for `search_service`, `check_inventory`, etc.
3. Keep the LLM beside the deterministic system (for intent translation and explanation), never above it as the traffic controller.

## Consequences
- **Positive:** System runs identically on local Ollama, cloud Gemini/OpenAI, or in pure rule-based fallback mode.
- **Positive:** Eliminates risk of prompt injection executing unauthorized backend actions.

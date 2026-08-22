# ADR-001: Local-First & ₹0 Hackathon Architecture

## Status
Accepted

## Context
Public service infrastructure demonstrations at hackathons often fail due to unstable external cloud dependencies, unpredictable API bills, rate limits, or network drops. NIRANTAR requires a resilient, reproducible, and zero-cost local architecture.

## Decision
1. Core backend, ML models, orchestration, simulation, database, and dashboards must run 100% locally with zero internet requirement.
2. External cloud APIs (Gemini, OpenAI) are strictly optional adapters behind abstract interfaces.
3. Use a modular monolith architecture (FastAPI + PostgreSQL/SQLite + Redis) rather than distributed microservices.
4. Use Locust for distributed 10,000 virtual user load generation instead of expensive cloud testing suites.

## Consequences
- **Positive:** ₹0 runtime cost, 100% demo reliability under offline/airplane mode, zero rate-limit anxiety.
- **Positive:** Fast feedback loops during development and evaluation.
- **Compliance:** 300–500 lines per file governance enforced; zero real PII stored.

# 🏛️ NIRANTAR — System Architecture & Flow Diagrams

Mermaid diagrams illustrating key end-to-end workflows in the NIRANTAR platform.

---

## 1. End-to-End Citizen Journey Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen (Voice / Text)
    participant UI as Multilingual Frontend (M8)
    participant SAATHI as Intent Extractor (M1)
    participant KAVACH as Kavach Security Gateway (M3)
    participant FORGE as Action Executor (M4)
    participant TWIN as Digital Twin / DB (M0)
    participant GROUND as Grounded Verifier (M5)

    Citizen->>UI: "Book train Howrah to Delhi for 2 people"
    UI->>SAATHI: POST /api/v1/citizen/intent
    SAATHI-->>UI: CitizenIntent (HWH->NDLS, 3A, 2 pax)
    UI->>KAVACH: POST /api/v1/security/evaluate
    KAVACH-->>UI: SecurityVerdict (ALLOW, threat=0.04)
    UI->>FORGE: POST /api/v1/executor/dispatch (search_train)
    FORGE->>TWIN: Query train routes & seat inventory
    TWIN-->>FORGE: Trains 12301 Rajdhani, 12259 Duronto
    FORGE->>GROUND: POST /api/v1/search/ground-verification
    GROUND-->>FORGE: GroundingResult (is_grounded=true)
    FORGE-->>UI: Safe verified train recommendations
    UI-->>Citizen: Render 3 best train options in preferred language
```

---

## 2. Dhara Adaptive Self-Healing & Surge Shedding

```mermaid
sequenceDiagram
    autonumber
    participant Telemetry as Telemetry Stream (RPS/CPU/RAM)
    participant CommandCenter as Command Center Orchestrator (M7)
    participant Dhara as Dhara Overload Engine (M7)
    participant TokenBucket as Dynamic Token Bucket (M6)
    participant CircuitBreaker as Circuit Breaker (M4)

    Telemetry->>CommandCenter: TelemetryEvent (p95=1.8s, cpu=96%, queue=180)
    CommandCenter->>Dhara: evaluate_telemetry()
    Note over Dhara: Overload Threshold Exceeded!
    Dhara->>TokenBucket: Activate Level 3 Load Shedding (Limit non-critical VUs)
    Dhara->>CircuitBreaker: Trip to OPEN on downstream timeout
    Note over CircuitBreaker: Fast-fail non-critical & serve cached Digital Twin
    Dhara-->>CommandCenter: Self-Healing Action Logged
```

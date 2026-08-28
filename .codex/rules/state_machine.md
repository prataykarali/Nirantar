# Journey State Machine Specification

## States
- `IDLE`: Initial state awaiting query.
- `SEARCH`: Searching train inventory and availability across 85+ stations and 550+ trains.
- `SELECTION`: Citizen selects train class, quota, and schedule.
- `PASSENGERS`: Passenger list drafted and verified.
- `PAYMENT`: Idempotent payment bridge processing.
- `CONFIRMED`: Ticket generated with PNR, coach/berth allocation, and DigiLocker integration.

## Invariant
- The LLM can never transition states directly. Every state transition is guarded by deterministic backend validation.

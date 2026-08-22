# ADR-003: Cairo as a Narrow Verifiable Trust Primitive

## Status
Accepted

## Context
Civic platforms require verifiable proof that rate-limiting, quota allocation, and telemetry aggregation are conducted transparently without corruption or bias. However, rewriting the entire backend in a ZK-STARK language introduces prohibitive complexity.

## Decision
1. Position **Cairo** strictly as a narrow, strategic trust primitive.
2. Use Cairo smart contracts / provable programs (`cairo/src/lib.cairo`) to verify mathematical invariants of telemetry batches (e.g. claimed average RPS vs sample counts) and policy compliance.
3. Execute Cairo proofs locally using the **Scarb** build toolchain and **Starknet Devnet** with zero gas fees.

## Consequences
- **Positive:** Demonstrates verifiable public-service computation without blockchain transaction fees.
- **Positive:** Keeps the core backend in Python (FastAPI/PyTorch) for high velocity and developer ergonomics.

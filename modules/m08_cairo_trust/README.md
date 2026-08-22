# Module 8 — Cairo Trust

**Drop new Module 8 files in this folder.** Existing Scarb/Cairo sources already live here (`src/lib.cairo`, `Scarb.toml`). Root `cairo/` is a symlink to this directory.

---

# NIRANTAR — Cairo Verifiable Trust Primitive

> **Owning Agent:** SENTINEL (Kavach / Security & Trust)  
> **Role:** Verifiable computation of telemetry aggregation and security policy enforcement

---

## 🎯 Architectural Intent

Cairo is used in NIRANTAR as a **narrow, strategic trust primitive**, NOT as the general backend language:

1. **Provable Telemetry Integrity**: Mathematically proves that telemetry aggregation (RPS, concurrency, failure rates) was calculated correctly without manipulation.
2. **Deterministic Policy Proofs**: Verifies that rate-limiting and admission-control decisions followed strict mathematical invariants.
3. **Local Devnet Execution**: Runs locally via **Scarb**, **Starknet Foundry**, and **Starknet Devnet** with ₹0 cost and zero blockchain transaction fees.

---

## 🛠️ Tooling & Local Execution

```bash
# Build Cairo contracts using Scarb
cd cairo
scarb build

# Run local Starknet Devnet (Zero fees)
starknet-devnet --port 5050
```

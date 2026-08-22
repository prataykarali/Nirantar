# Contributing to NIRANTAR

Thank you for your interest in contributing to **NIRANTAR: AI-Powered Public-Service Resilience Platform**!

---

## Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/prataykarali/Nirantar.git
   cd Nirantar
   ```

2. **Setup Python Environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e .
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

---

## Code Quality Standards

All pull requests must satisfy the following criteria:
- **Zero Hardcoding Violations:** Checked via `python3 code-quality-agents/evals/anti_hardcoding_auditor.py --dir .`
- **Never Nester Principle:** Maximum nesting depth $\le 3$ across all functions.
- **Test Coverage:** All new features must include pytest test cases in `tests/`.
- **Zero-PII Compliance:** Never commit or expose passwords, OTPs, CVVs, or unmasked IDs in logs or tests.

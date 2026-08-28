# Zero-PII Policy & Allowlist Boundary

## Absolute Rules
1. **Never Send Credentials to AI:** Passwords, OTPs, CVVs, card numbers, UPI PINs, session tokens, and 12-digit Aadhaar IDs MUST NEVER enter LLM context.
2. **Deterministic Sanitization:** All citizen inputs pass through `PiiRedactor` before dispatch to external inference endpoints.
3. **Drafting Only:** AI may draft non-sensitive passenger parameters (Name, Age, Gender, Berth Preference) but cannot submit payments directly.

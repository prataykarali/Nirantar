#!/usr/bin/env python3
"""
Standalone verification script for NIRANTAR KAVACH Security & Zero-PII Sanitizer.
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from security.privacy.masking import sanitize_payload, mask_name, mask_phone, mask_card, mask_aadhaar
from security.gateway import KavachGateway


def main() -> None:
    print("Running KAVACH Security & Zero-PII Audit Check...")
    
    # 1. PII Masking
    assert "***" in mask_name("Vikram Singh")
    assert "***" in mask_phone("9876543210")
    assert "***" in mask_card("4111111111111111")
    assert "XXXX" in mask_aadhaar("123456789012")
    
    # 2. Sanitizer
    dirty = {"password": "top_secret_pass", "otp": "123456", "name": "Vikram Singh"}
    clean = sanitize_payload(dirty)
    assert "top_secret_pass" not in json.dumps(clean)
    assert "123456" not in json.dumps(clean)
    
    # 3. Gateway
    gw = KavachGateway()
    assessment, allowed, reason = gw.evaluate("sess_test_001", "SEARCH")
    assert allowed is True
    
    print("✅ All KAVACH Security & Zero-PII invariants verified successfully!")


if __name__ == "__main__":
    main()

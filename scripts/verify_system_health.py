#!/usr/bin/env python3
"""
Standalone verification script for NIRANTAR Module 9 System Health Prober.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app


def main() -> None:
    print("Probing NIRANTAR System Health & Version Manifest...")
    client = TestClient(app)
    
    res_h = client.get("/api/v1/system/health")
    assert res_h.status_code == 200
    data_h = res_h.json()
    print(f"✅ System Health Status: {data_h.get('health', 'unknown').upper()} ({len(data_h.get('modules', {}))} modules probed)")
    
    res_v = client.get("/api/v1/system/version")
    assert res_v.status_code == 200
    data_v = res_v.json()
    print(f"✅ Platform Version: {data_v.get('version')} | Architecture: {data_v.get('architecture')}")


if __name__ == "__main__":
    main()

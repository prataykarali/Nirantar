"""
NIRANTAR — Supabase Client & Database Gateway
=============================================
Provides clean integration with Supabase for PostgreSQL, REST, Auth, and Storage.
Seamlessly falls back to local execution when credentials are not configured.
"""

from __future__ import annotations
import os
import httpx
from typing import Optional, Dict, Any, List


def get_supabase_credentials() -> Dict[str, Optional[str]]:
    """Retrieve Supabase URL and Keys from environment variables."""
    url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or os.getenv("VITE_SUPABASE_URL")
    )
    anon_key = (
        os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
    )
    service_role_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SECRET_KEY")
    )
    return {
        "url": url,
        "anon_key": anon_key,
        "service_role_key": service_role_key or anon_key,
        "jwt_secret": os.getenv("SUPABASE_JWT_SECRET"),
    }


def is_supabase_configured() -> bool:
    creds = get_supabase_credentials()
    return bool(creds["url"] and (creds["anon_key"] or creds["service_role_key"]))


class SupabaseGateway:
    """Lightweight, zero-dependency async client for Supabase REST API."""

    def __init__(self):
        self.creds = get_supabase_credentials()
        self.base_url = self.creds["url"].rstrip("/") if self.creds["url"] else ""
        self.key = self.creds["service_role_key"] or self.creds["anon_key"] or ""

    def headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def query_table(self, table: str, select: str = "*", limit: int = 50) -> List[Dict[str, Any]]:
        if not is_supabase_configured():
            return []
        url = f"{self.base_url}/rest/v1/{table}?select={select}&limit={limit}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self.headers())
                if resp.is_success:
                    return resp.json()
                return []
        except Exception:
            return []

    async def insert_row(self, table: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not is_supabase_configured():
            return None
        url = f"{self.base_url}/rest/v1/{table}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=self.headers(), json=payload)
                if resp.is_success:
                    data = resp.json()
                    return data[0] if isinstance(data, list) and data else data
                return None
        except Exception:
            return None


supabase_gateway = SupabaseGateway()

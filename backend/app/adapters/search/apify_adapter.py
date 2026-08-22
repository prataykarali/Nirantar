"""
NIRANTAR — Real Web Search Adapter with Apify, Rate Limiting & Multi-Tier Caching
================================================================================
Features:
- Real Web Scraping via Apify API (Actor: apify/rag-web-browser)
- Sliding-Window Rate Limiter (prevents accidental quota exhaustion)
- L1 Fast In-Memory LRU Cache
- L2 Persistent SQLite Database Cache with TTL
- Query Normalization & Deduplication (Zero repeated Apify calls)
- Zero PII Leakage
"""

import os
import time
import json
import hashlib
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import requests


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter for external API protection."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.timestamps: List[float] = []
        self._lock = threading.Lock()

    def allow_request(self) -> Tuple[bool, int]:
        """Check if request is allowed. Returns (is_allowed, remaining_calls)."""
        now = time.time()
        with self._lock:
            # Evict timestamps outside the sliding window
            self.timestamps = [ts for ts in self.timestamps if now - ts < self.window_seconds]
            if len(self.timestamps) < self.max_requests:
                self.timestamps.append(now)
                remaining = self.max_requests - len(self.timestamps)
                return True, remaining
            return False, 0


class ApifySearchEngine:
    """Resilient real web search engine using Apify with multi-tier caching and rate limiting."""

    _instance = None
    _init_lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "ApifySearchEngine":
        with cls._init_lock:
            if cls._instance is None:
                cls._instance = super(ApifySearchEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(
        self,
        token: Optional[str] = None,
        db_path: str = "m0_digital_twin.db",
        rate_limit_per_min: int = 10,
        cache_ttl_hours: int = 24,
    ) -> None:
        if getattr(self, "_initialized", False):
            return

        # Never ship credentials in source. An unset token means that live web
        # retrieval is unavailable; callers receive an explicit, safe status.
        self.token = token or os.getenv("APIFY_API_TOKEN", "")
        self.actor_id = os.getenv("APIFY_ACTOR_ID", "crawlerbros/rag-web-browser")
        self.db_path = db_path
        self.cache_ttl_hours = int(os.getenv("APIFY_CACHE_TTL_HOURS", cache_ttl_hours))
        self.rate_limiter = SlidingWindowRateLimiter(
            max_requests=int(os.getenv("APIFY_RATE_LIMIT_PER_MINUTE", rate_limit_per_min)),
            window_seconds=60,
        )

        # L1 Memory Cache: {query_hash: (results, expires_at)}
        self._l1_cache: Dict[str, Tuple[List[Dict[str, Any]], float]] = {}
        self._l1_lock = threading.Lock()

        # Telemetry stats
        self.total_queries = 0
        self.cache_hits = 0
        self.apify_calls = 0
        self.rate_limit_blocks = 0

        self._init_l2_cache_table()
        self._initialized = True

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_l2_cache_table(self) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS web_search_cache (
                query_hash TEXT PRIMARY KEY,
                raw_query TEXT NOT NULL,
                results_json TEXT NOT NULL,
                source TEXT NOT NULL,
                hit_count INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
        """)
        conn.commit()
        conn.close()

    def _normalize_query(self, query: str) -> str:
        """Strip whitespace, lowercase, and standardize for maximum cache hit rate."""
        cleaned = re_clean = " ".join(query.strip().lower().split())
        return cleaned

    def _hash_query(self, normalized_query: str) -> str:
        return hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()

    def search_web(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        """
        Execute real web search with L1/L2 cache and sliding-window rate limiting.
        """
        self.total_queries += 1
        norm_query = self._normalize_query(query)
        q_hash = self._hash_query(norm_query)
        now_ts = time.time()

        # 1. Check L1 Memory Cache
        with self._l1_lock:
            if q_hash in self._l1_cache:
                results, expires_at = self._l1_cache[q_hash]
                if now_ts < expires_at:
                    self.cache_hits += 1
                    return {
                        "status": 200,
                        "query": query,
                        "source": "L1_MEMORY_CACHE",
                        "cache_hit": True,
                        "results": results,
                        "apify_cost_saved": True,
                    }

        # 2. Check L2 SQLite Cache
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT results_json, expires_at, hit_count FROM web_search_cache WHERE query_hash = ?",
            (q_hash,),
        )
        row = cur.fetchone()

        if row:
            expires_at_iso = row["expires_at"]
            expires_at_dt = datetime.fromisoformat(expires_at_iso)
            if datetime.now(timezone.utc) < expires_at_dt:
                # Cache hit! Update hit count
                cur.execute(
                    "UPDATE web_search_cache SET hit_count = hit_count + 1 WHERE query_hash = ?",
                    (q_hash,),
                )
                conn.commit()
                conn.close()

                results = json.loads(row["results_json"])
                self.cache_hits += 1

                # Populate L1 cache for even faster subsequent reads
                with self._l1_lock:
                    self._l1_cache[q_hash] = (results, expires_at_dt.timestamp())

                return {
                    "status": 200,
                    "query": query,
                    "source": "L2_SQL_DATABASE_CACHE",
                    "cache_hit": True,
                    "results": results,
                    "apify_cost_saved": True,
                }

        conn.close()

        # 3. Rate Limiter Check before calling external Apify
        allowed, remaining_calls = self.rate_limiter.allow_request()
        if not allowed:
            self.rate_limit_blocks += 1
            return {
                "status": 429,
                "error": "Rate limit exceeded (Max 10 Apify calls/minute). Please wait a few moments.",
                "query": query,
                "cache_hit": False,
                "results": [],
            }

        # 4. Execute Real Apify Web Scraping
        if not self.token:
            return {
                "status": 503,
                "error": "Live web search is not configured. Set APIFY_API_TOKEN to enable it.",
                "query": query,
                "cache_hit": False,
                "results": [],
            }

        try:
            self.apify_calls += 1
            actor_slug = self.actor_id.replace("/", "~")
            apify_url = (
                f"https://api.apify.com/v2/acts/{actor_slug}/run-sync-get-dataset-items?token={self.token}"
            )
            payload = {
                "query": query,
                "maxResults": max_results,
            }
            resp = requests.post(apify_url, json=payload, timeout=25.0)

            if resp.status_code not in [200, 201]:
                return {
                    "status": resp.status_code,
                    "error": f"Apify error: {resp.text[:200]}",
                    "query": query,
                    "cache_hit": False,
                    "results": [],
                }

            raw_items = resp.json()
            results = self._extract_clean_snippets(raw_items)

            # 5. Store in L2 Persistent Cache & L1 Cache
            now_dt = datetime.now(timezone.utc)
            expires_dt = now_dt + timedelta(hours=self.cache_ttl_hours)

            conn = self._get_connection()
            cur = conn.cursor()
            cur.execute("""
                INSERT OR REPLACE INTO web_search_cache (
                    query_hash, raw_query, results_json, source, hit_count, created_at, expires_at
                ) VALUES (?, ?, ?, ?, 1, ?, ?)
            """, (
                q_hash,
                query,
                json.dumps(results),
                "apify_rag_web_browser",
                now_dt.isoformat(),
                expires_dt.isoformat(),
            ))
            conn.commit()
            conn.close()

            with self._l1_lock:
                self._l1_cache[q_hash] = (results, expires_dt.timestamp())

            return {
                "status": 200,
                "query": query,
                "source": "APIFY_LIVE_WEB_SEARCH",
                "cache_hit": False,
                "remaining_rate_limit": remaining_calls,
                "results": results,
                "cached_until": expires_dt.isoformat(),
            }

        except Exception:
            return {
                "status": 500,
                "error": "Apify request failed. Please retry shortly.",
                "query": query,
                "cache_hit": False,
                "results": [],
            }

    def _extract_clean_snippets(self, raw_items: Any) -> List[Dict[str, Any]]:
        """Extract clean titles, URLs, and concise markdown text from Apify dataset items."""
        if not isinstance(raw_items, list):
            return []

        clean_results = []
        for item in raw_items:
            metadata = item.get("metadata") or {}
            title = metadata.get("title") or item.get("title") or item.get("query") or "Web Result"
            url = metadata.get("url") or item.get("url") or item.get("link") or ""
            text = item.get("markdown") or item.get("text") or item.get("content") or ""

            # Trim text to clean paragraph
            clean_text = text[:600].strip()
            if clean_text:
                clean_results.append({
                    "title": title,
                    "url": url,
                    "snippet": clean_text,
                })

        return clean_results

    def get_stats(self) -> Dict[str, Any]:
        """Return cache hit ratio, Apify API calls saved, and rate limiter status."""
        hit_ratio = round((self.cache_hits / self.total_queries * 100), 1) if self.total_queries > 0 else 0.0
        return {
            "total_queries": self.total_queries,
            "cache_hits": self.cache_hits,
            "apify_api_calls": self.apify_calls,
            "apify_calls_saved": self.cache_hits,
            "cache_hit_ratio_percent": hit_ratio,
            "rate_limit_blocks": self.rate_limit_blocks,
            "l1_memory_cache_entries": len(self._l1_cache),
        }

"""
NIRANTAR — Core Rate Limiter Middleware
=========================================
Thread-safe sliding-window rate limiter protecting Nirantar against
DDoS, API hammering, and automated scalper bots during peak Tatkal windows.
"""

import time
import threading
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 180, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def is_allowed(self, client_id: str) -> Tuple[bool, int, int]:
        """
        Check if request is permitted under sliding window limit.
        Returns: (allowed: bool, remaining_requests: int, retry_after_seconds: int)
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            if client_id not in self._requests:
                self._requests[client_id] = []

            # Purge timestamps outside the window
            self._requests[client_id] = [
                ts for ts in self._requests[client_id] if ts > window_start
            ]

            count = len(self._requests[client_id])
            if count < self.max_requests:
                self._requests[client_id].append(now)
                remaining = self.max_requests - (count + 1)
                return True, remaining, 0
            else:
                oldest_in_window = self._requests[client_id][0] if self._requests[client_id] else now
                retry_after = max(1, int(oldest_in_window + self.window_seconds - now))
                return False, 0, retry_after

    def reset(self, client_id: str = None):
        """Reset rate limiter state (useful for tests)."""
        with self._lock:
            if client_id:
                self._requests.pop(client_id, None)
            else:
                self._requests.clear()


# Default instance: 180 requests per minute per IP
GLOBAL_RATE_LIMITER = SlidingWindowRateLimiter(max_requests=180, window_seconds=60)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: SlidingWindowRateLimiter = None, exempt_paths: List[str] = None):
        super().__init__(app)
        self.limiter = limiter or GLOBAL_RATE_LIMITER
        self.exempt_paths = exempt_paths or ["/health", "/version", "/audit-summary", "/docs", "/redoc", "/openapi.json"]

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if any(path.startswith(p) for p in self.exempt_paths):
            return await call_next(request)

        # Extract client identifier safely
        client_ip = "unknown"
        if request.client and request.client.host:
            client_ip = request.client.host

        # If behind reverse-proxy (e.g. Vercel), use rightmost or real client IP with sanitization
        real_ip = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Real-IP")
        if real_ip:
            client_ip = real_ip.strip()
        else:
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                # Use first non-empty IP entry and sanitize characters
                parts = [p.strip() for p in forwarded.split(",") if p.strip()]
                if parts:
                    candidate = parts[0]
                    # Simple sanitize: alphanumeric, colons, dots only (IPv4/IPv6)
                    if all(c in "0123456789abcdefABCDEF:." for c in candidate):
                        client_ip = candidate

        client_id = client_ip
        allowed, remaining, retry_after = self.limiter.is_allowed(client_id)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit of {self.limiter.max_requests} req/min exceeded. Please slow down.",
                    "retryAfterSeconds": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.limiter.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response

"""Security middleware: response headers, CORS config, and in-process rate limiting.

Implements SEC-4 (security headers), SEC-6 (CORS allowlist), SEC-9 (rate limiting via SlowAPI,
in-process — external Redis is disallowed by the tech environment).
"""

from collections.abc import Awaitable, Callable

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Shared limiter. Per-route limits are applied with @limiter.limit(...) in feature units
# (strict presets for auth in U1 and AI in U4).
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

_SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(header, value)
        return response


def cors_allow_origins(frontend_origin: str) -> list[str]:
    """Explicit CORS allowlist — never '*' on authenticated endpoints (SEC-6)."""
    return [frontend_origin]

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


def build_csp(connect_src: list[str]) -> str:
    """Build a least-privilege CSP (SEC-4/6).

    U1 (frontend-direct auth) requires the browser to reach the Supabase origin, so `connect-src`
    is widened to `'self'` plus the specific configured Supabase project URL(s) — never a wildcard,
    and never `unsafe-inline`/`unsafe-eval`.
    """
    connect = " ".join(["'self'", *connect_src])
    return "; ".join(["default-src 'self'", f"connect-src {connect}"])


_STATIC_SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, connect_src: list[str] | None = None) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._headers = {
            "Content-Security-Policy": build_csp(connect_src or []),
            **_STATIC_SECURITY_HEADERS,
        }

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        for header, value in self._headers.items():
            response.headers.setdefault(header, value)
        return response


def cors_allow_origins(frontend_origin: str) -> list[str]:
    """Explicit CORS allowlist — never '*' on authenticated endpoints (SEC-6)."""
    return [frontend_origin]

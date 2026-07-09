"""FastAPI application entry point.

Wires the U0 foundation: settings (fail-closed), structured logging, security headers,
CORS allowlist, rate limiting, global error handler, and the /api/v1 router.
Feature units (U1–U5) register their routers here.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.routes import health
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import CorrelationIdMiddleware, configure_logging
from app.core.security import SecurityHeadersMiddleware, cors_allow_origins, limiter


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()  # validates env at startup (fail closed)

    app = FastAPI(title="MemoRise API", version="0.1.0")

    # Rate limiting (SlowAPI, in-process)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Cross-cutting middleware. CSP connect-src is widened to the specific Supabase origin so the
    # browser can reach Supabase Auth directly (U1) — least-privilege, no wildcard.
    app.add_middleware(SecurityHeadersMiddleware, connect_src=[settings.supabase_url])
    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_allow_origins(settings.frontend_origin),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    # Routers (U0 ships /health; feature units add decks, cards, review, ai, auth, profile)
    app.include_router(health.router, prefix="/api/v1")
    return app


def _rate_limit_handler(request, exc):  # type: ignore[no-untyped-def]
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


app = create_app()

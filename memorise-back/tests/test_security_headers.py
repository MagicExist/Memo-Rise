"""U1 CSP tests — connect-src is widened to the specific Supabase origin, least-privilege (SEC-4/6).

The Supabase URL comes from settings (conftest sets it to http://localhost for tests).
"""

from fastapi.testclient import TestClient

from app.core.security import build_csp
from app.main import app

client = TestClient(app)


def test_csp_allows_supabase_origin_and_self() -> None:
    csp = client.get("/api/v1/health").headers["Content-Security-Policy"]
    assert "default-src 'self'" in csp
    assert "connect-src 'self' http://localhost" in csp


def test_csp_is_least_privilege() -> None:
    csp = client.get("/api/v1/health").headers["Content-Security-Policy"]
    # No dangerous relaxations and no wildcard Supabase origin.
    assert "unsafe-inline" not in csp
    assert "unsafe-eval" not in csp
    assert "*" not in csp


def test_build_csp_pins_specific_origins() -> None:
    csp = build_csp(["https://abc123.supabase.co"])
    assert csp == "default-src 'self'; connect-src 'self' https://abc123.supabase.co"

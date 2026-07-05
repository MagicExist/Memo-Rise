"""Property-based test for config validation (PBT-01 property for U0).

Property (invariant): for ANY required variable that is missing, settings validation MUST
reject startup — the app never boots half-configured (business rule R3.1 / SEC-15 fail-closed).
"""

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from pydantic import ValidationError

from app.core.config import Settings

REQUIRED = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_JWT_SECRET",
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
]


@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(missing=st.sampled_from(REQUIRED))
def test_missing_required_var_is_rejected(monkeypatch: pytest.MonkeyPatch, missing: str) -> None:
    # Provide every required var except the randomly chosen missing one.
    for key in REQUIRED:
        monkeypatch.delenv(key, raising=False)
    for key in REQUIRED:
        if key != missing:
            monkeypatch.setenv(key, "placeholder")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)

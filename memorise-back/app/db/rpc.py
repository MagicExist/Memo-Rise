"""Base helper for calling Postgres RPC functions from the backend.

Multi-step atomic writes (e.g. `rate_card` in U3) run as a single Postgres transaction via
an RPC function. This module provides the thin wrapper; concrete calls live in feature units.
"""

from typing import Any

from sqlalchemy import text
from sqlmodel import Session


def call_rpc(session: Session, function_name: str, params: dict[str, Any]) -> Any:
    """Call a Postgres function `function_name(:param, ...)` and return its scalar result.

    Concrete signatures (e.g. rate_card) are defined by feature units. Uses bound parameters
    only — never string interpolation (SEC-5, injection prevention).
    """
    placeholders = ", ".join(f":{key}" for key in params)
    statement = text(f"select {function_name}({placeholders})")
    return session.exec(statement, params=params).scalar_one_or_none()  # type: ignore[call-overload]

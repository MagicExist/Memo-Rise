"""Database engine/session setup.

The engine is created from settings. Feature units (starting U2) obtain a session via
`get_session`. RLS is enforced at the DB by forwarding the authenticated user's identity;
the concrete claim-forwarding helper is added when the first user-data table is accessed (U2).
"""

from collections.abc import Iterator
from functools import lru_cache

from sqlmodel import Session, create_engine

from app.core.config import get_settings


@lru_cache
def get_engine():  # type: ignore[no-untyped-def]
    settings = get_settings()
    return create_engine(settings.database_url, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session

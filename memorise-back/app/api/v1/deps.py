"""Shared API dependencies — JWT verification (SEC-6 / business rule R6).

Deny-by-default: protected routes depend on `get_current_user_id`, which verifies the
Supabase-issued JWT server-side on every request. The same token is forwarded to the DB
so RLS also applies (defense in depth) — see app/db/session.py.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> str:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:  # invalid signature / expired / wrong audience
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return str(user_id)


CurrentUserId = Annotated[str, Depends(get_current_user_id)]

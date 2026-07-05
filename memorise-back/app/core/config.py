"""Application settings, loaded and validated from the environment (fail-closed).

Per NFR-12/SEC-10/SEC-12: secrets come only from environment variables. Missing or invalid
required values abort startup rather than running half-configured (business rule R3.1).
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"

    # --- Supabase / data + auth ---
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str  # used to verify Supabase-issued JWTs (HS256)
    database_url: str

    # --- Anthropic (used by U4; model is configurable, default Claude Sonnet) ---
    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-5"
    ai_input_max_chars: int = Field(default=5000, ge=1)
    ai_max_cards: int = Field(default=20, ge=1)

    # --- CORS / networking ---
    frontend_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    """Return the validated settings singleton. Raises on missing/invalid required vars."""
    return Settings()

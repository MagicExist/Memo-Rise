"""Test configuration.

Sets safe placeholder env vars so the app/settings import cleanly, and registers a Hypothesis
profile that logs the reproducing seed/blob on failure (PBT-08 reproducibility).
"""

import os

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://localhost/test")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

from hypothesis import settings  # noqa: E402

settings.register_profile("ci", deadline=None, print_blob=True)
settings.load_profile("ci")

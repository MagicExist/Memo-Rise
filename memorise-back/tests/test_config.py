"""Example-based tests for settings (complements the property-based test, PBT-10)."""

from app.core.config import Settings


def test_settings_load_with_defaults() -> None:
    s = Settings(_env_file=None)  # env provided by conftest
    assert s.anthropic_model == "claude-sonnet-5"
    assert s.ai_input_max_chars == 5000
    assert s.ai_max_cards == 20
    assert s.frontend_origin.startswith("http")

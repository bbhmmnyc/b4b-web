"""Focused contract tests for consumer-facing UI translation."""

import asyncio
import os
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "blogs4blocks-test")

from models import UiTranslationRequest  # noqa: E402
from routes import translation  # noqa: E402


def test_ui_translation_preserves_order_and_deduplicates_provider_work(monkeypatch):
    calls = []

    async def fake_translate(text, target_language, source_language):
        calls.append((text, target_language, source_language))
        return f"es:{text}"

    monkeypatch.setattr(translation, "_translate_text", fake_translate)
    request = UiTranslationRequest(
        texts=["Welcome", "Search", "Welcome"],
        source_language="en",
        target_language="es",
    )

    result = asyncio.run(translation.translate_ui(request))

    assert result["translations"] == ["es:Welcome", "es:Search", "es:Welcome"]
    assert calls == [("Welcome", "es", "en"), ("Search", "es", "en")]
    assert result["machine_translated"] is True


def test_ui_translation_short_circuits_when_languages_match(monkeypatch):
    async def unexpected_translate(*_args):
        raise AssertionError("provider should not be called")

    monkeypatch.setattr(translation, "_translate_text", unexpected_translate)
    request = UiTranslationRequest(
        texts=["Already translated"],
        source_language="en",
        target_language="en",
    )

    result = asyncio.run(translation.translate_ui(request))

    assert result["translations"] == ["Already translated"]
    assert result["machine_translated"] is False


@pytest.mark.parametrize("language", ["xx", "english", "", "e"])
def test_ui_translation_rejects_unsupported_languages(language):
    with pytest.raises(ValidationError):
        UiTranslationRequest(texts=["Welcome"], target_language=language)


def test_ui_translation_enforces_batch_and_total_character_limits():
    with pytest.raises(ValidationError):
        UiTranslationRequest(texts=["text"] * 51, target_language="fr")

    with pytest.raises(ValidationError):
        UiTranslationRequest(texts=["x" * 1001], target_language="fr")

    with pytest.raises(ValidationError):
        UiTranslationRequest(texts=["x" * 1000] * 13, target_language="fr")

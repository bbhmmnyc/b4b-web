import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException


BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "blogs4blocks-test")

from models import TranslationRequest  # noqa: E402
from routes import translation  # noqa: E402


class FakePosts:
    def __init__(self, post):
        self.post = post

    async def find_one(self, *_args, **_kwargs):
        return self.post


class FakeDb:
    def __init__(self, post):
        self.posts = FakePosts(post)


def test_post_translation_reads_post_content_server_side(monkeypatch):
    calls = []

    async def fake_translate(text, target_language, source_language):
        calls.append((text, target_language, source_language))
        return f"es:{text}"

    monkeypatch.setattr(
        translation,
        "db",
        FakeDb({
            "id": "post-1",
            "title": "Title",
            "excerpt": "Excerpt",
            "content": "Content",
            "language": "en",
            "expires_at": None,
        }),
    )
    monkeypatch.setattr(translation, "_translate_text", fake_translate)

    result = asyncio.run(translation.translate_post(TranslationRequest(post_id="post-1", target_language="es")))

    assert result["title"] == "es:Title"
    assert result["content"] == "es:Content"
    assert calls == [
        ("Title", "es", "en"),
        ("Excerpt", "es", "en"),
        ("Content", "es", "en"),
    ]


def test_post_translation_rejects_private_posts(monkeypatch):
    monkeypatch.setattr(
        translation,
        "db",
        FakeDb({
            "id": "post-1",
            "title": "Title",
            "excerpt": "Excerpt",
            "content": "Content",
            "language": "en",
            "is_public": False,
        }),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(translation.translate_post(TranslationRequest(post_id="post-1", target_language="es")))

    assert error.value.status_code == 404

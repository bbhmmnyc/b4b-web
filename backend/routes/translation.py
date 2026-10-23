import asyncio
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from database import db
from models import (
    SUPPORTED_TRANSLATION_LANGUAGES,
    TranslationRequest,
    UiTranslationRequest,
)
from rate_limit import public_limiter

router = APIRouter()


def _cache_key(text: str, target_language: str, source_language: str) -> str:
    raw = f"{source_language}|{target_language}|{text}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def _translate_text(text: str, target_language: str, source_language: str) -> str:
    if not text:
        return text

    source = source_language or "auto"
    key = _cache_key(text, target_language, source)
    cached = await db.translation_cache.find_one({"key": key}, {"_id": 0})
    if cached:
        return cached["translated_text"]

    # The provider call is blocking urllib; run it off the event loop.
    translated = await asyncio.to_thread(_call_translation_provider, text, target_language, source)

    await db.translation_cache.update_one(
        {"key": key},
        {
            "$set": {
                "key": key,
                "source_language": source,
                "target_language": target_language,
                "source_hash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                "translated_text": translated,
                "provider": os.environ.get("TRANSLATION_PROVIDER", "libretranslate"),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )
    return translated


def _call_translation_provider(text: str, target_language: str, source_language: str) -> str:
    provider = os.environ.get("TRANSLATION_PROVIDER", "libretranslate").lower().strip()

    if provider == "deepl":
        return _call_deepl(text, target_language, source_language)

    return _call_libretranslate(text, target_language, source_language)


def _call_libretranslate(text: str, target_language: str, source_language: str) -> str:
    base_url = os.environ.get("LIBRETRANSLATE_URL", "").rstrip("/")
    api_key = os.environ.get("LIBRETRANSLATE_API_KEY", "")
    if not base_url:
        raise HTTPException(
            status_code=503,
            detail="Translation is not configured yet. Set LIBRETRANSLATE_URL or choose another TRANSLATION_PROVIDER.",
        )

    payload = {
        "q": text,
        "source": source_language if source_language != "auto" else "auto",
        "target": target_language,
        "format": "html" if "<" in text and ">" in text else "text",
    }
    if api_key:
        payload["api_key"] = api_key

    return _post_json_for_translation(f"{base_url}/translate", payload, "translatedText")


def _call_deepl(text: str, target_language: str, source_language: str) -> str:
    api_key = os.environ.get("DEEPL_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Translation is not configured yet. Set DEEPL_API_KEY or use LibreTranslate.",
        )

    api_url = os.environ.get("DEEPL_API_URL", "https://api-free.deepl.com/v2/translate")
    data = {
        "auth_key": api_key,
        "text": text,
        "target_lang": target_language.upper(),
        "tag_handling": "html" if "<" in text and ">" in text else "",
    }
    if source_language and source_language != "auto":
        data["source_lang"] = source_language.upper()

    encoded = urllib.parse.urlencode({key: value for key, value in data.items() if value}).encode("utf-8")
    req = urllib.request.Request(api_url, data=encoded, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Translation provider error: {exc.code}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Translation provider unavailable") from exc

    translations = payload.get("translations") or []
    if not translations:
        raise HTTPException(status_code=502, detail="Translation provider returned no translation")
    return translations[0].get("text", "")


def _post_json_for_translation(url: str, payload: dict, response_field: str) -> str:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Translation provider error: {exc.code}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Translation provider unavailable") from exc

    translated = data.get(response_field)
    if translated is None:
        raise HTTPException(status_code=502, detail="Translation provider returned no translation")
    return translated


def _post_is_translatable(post: dict) -> bool:
    if post.get("is_public") is False:
        return False

    expires_at = post.get("expires_at")
    if not expires_at:
        return True

    try:
        expires = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
    except ValueError:
        return False
    return expires > datetime.now(timezone.utc)


def _post_source_language(requested: str | None, post: dict) -> str:
    source = requested if requested and requested != "auto" else post.get("language")
    if source in SUPPORTED_TRANSLATION_LANGUAGES:
        return source
    return "auto"


@router.post("/translate/ui")
async def translate_ui(req: UiTranslationRequest, request: Request = None):
    if request is not None:
        public_limiter.check(request, "translate-ui", maximum=20, window_seconds=60)
    source_language = req.source_language
    if source_language == req.target_language:
        return {
            "translations": req.texts,
            "source_language": source_language,
            "target_language": req.target_language,
            "machine_translated": False,
        }

    translated_by_text = {}
    for text in dict.fromkeys(req.texts):
        translated_by_text[text] = await _translate_text(text, req.target_language, source_language)

    return {
        "translations": [translated_by_text[text] for text in req.texts],
        "source_language": source_language,
        "target_language": req.target_language,
        "machine_translated": True,
    }


@router.post("/translate/post")
async def translate_post(req: TranslationRequest, request: Request = None):
    if request is not None:
        public_limiter.check(request, "translate-post", maximum=20, window_seconds=60)
    post = await db.posts.find_one(
        {"id": req.post_id},
        {"_id": 0, "title": 1, "excerpt": 1, "content": 1, "language": 1, "expires_at": 1, "is_public": 1},
    )
    if not post or not _post_is_translatable(post):
        raise HTTPException(status_code=404, detail="Post not found")

    source_language = _post_source_language(req.source_language, post)
    target_language = req.target_language
    if source_language == target_language:
        return {
            "title": post["title"],
            "excerpt": post.get("excerpt", ""),
            "content": post["content"],
            "source_language": source_language,
            "target_language": target_language,
            "machine_translated": False,
        }

    translated_title = await _translate_text(post["title"], target_language, source_language)
    translated_excerpt = await _translate_text(post.get("excerpt", ""), target_language, source_language)
    translated_content = await _translate_text(post["content"], target_language, source_language)

    return {
        "title": translated_title,
        "excerpt": translated_excerpt,
        "content": translated_content,
        "source_language": source_language,
        "target_language": target_language,
        "machine_translated": True,
        "notice": "Machine translation provided for convenience. Original author language is the source version.",
    }

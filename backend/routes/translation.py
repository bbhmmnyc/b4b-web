import hashlib
import json
import os
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from database import db
from models import TranslationRequest

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

    translated = _call_translation_provider(text, target_language, source)

    await db.translation_cache.update_one(
        {"key": key},
        {"$set": {
            "key": key,
            "source_language": source,
            "target_language": target_language,
            "source_hash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "translated_text": translated,
            "provider": os.environ.get("TRANSLATION_PROVIDER", "libretranslate"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
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

    encoded = urllib.parse.urlencode({k: v for k, v in data.items() if v}).encode("utf-8")
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


@router.post("/translate/post")
async def translate_post(req: TranslationRequest):
    source_language = req.source_language or "auto"
    if source_language == req.target_language:
        return {
            "title": req.title,
            "excerpt": req.excerpt,
            "content": req.content,
            "source_language": source_language,
            "target_language": req.target_language,
            "machine_translated": False,
        }

    translated_title = await _translate_text(req.title or "", req.target_language, source_language)
    translated_excerpt = await _translate_text(req.excerpt or "", req.target_language, source_language)
    translated_content = await _translate_text(req.content, req.target_language, source_language)

    return {
        "title": translated_title,
        "excerpt": translated_excerpt,
        "content": translated_content,
        "source_language": source_language,
        "target_language": req.target_language,
        "machine_translated": True,
        "notice": "Machine translation provided for convenience. Original author language is the source version.",
    }

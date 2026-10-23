import os
import hashlib 
import asyncio
import urllib.request
import urllib.error
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from database import db
from models import TranslationRequest
from rate_limit import public_limiter

router = APIRouter()

# --- Provider call (unchanged logic, runs in thread) ---

def _call_translation_provider(text: str, target_language: str, source_language: str =
"auto") -> str:
    """Synchronous provider call. Runs via asyncio.to_thread so it never blocks the event loop."""
    api_key = os.environ.get("TRANSLATION_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Translation service is not configured")

    url = "https://libretranslate.com/translate"
    params = {
        "q": text,
        "source": source_language or "auto",
        "target": target_language,
        "format": "text",
        "api_key": api_key,
    }
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": 
    "application/x-www-form-urlencoded"})

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8")) 
            return result.get("translatedText", text)
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Translation provider error: {e.code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail="Translation provider unavailable")


# --- Cache helpers ---


def _cache_key(post_id: str, target_language: str) -> str:
    return hashlib.sha256(f"{post_id}:{target_language}".encode()).hexdigest()


async def _get_cached(post_id: str, target_language: str):
    return await db.translation_cache.find_one(
        {"key": _cache_key(post_id, target_language)},
        {"_id": 0, "translated_text": 1}
    )
       

async def _set_cache(post_id: str, target_language: str, translated_text: str, source_text: str):
    await db.translation_cache.update_one(
        {"key": _cache_key(post_id, target_language)},
        {"$set": {
            "key": _cache_key(post_id, target_language),  
            "post_id": post_id,
            "target_language": target_language,
            "source_text": source_text, 
            "translated_text": translated_text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )


# --- Endpoints ---

@router.post("/translate/post")
async def translate_post(req: TranslationRequest, request: Request): 
    """
    Translate an existing post by ID. Rejects requests for posts that don't exist
    or aren't public, so the endpoint can't be used as a free text-translation proxy. 
    """
    public_limiter.check(request, "translate", maximum=20, window_seconds=60)

    post = await db.posts.find_one(
        {"id": req.post_id},
        {"_id": 0, "title": 1, "excerpt": 1, "content": 1, "language": 1, "expires_at": 1}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Don't translate expired/unlisted posts
    now_iso = datetime.now(timezone.utc).isoformat()
    expires_at = post.get("expires_at")
    if expires_at and expires_at < now_iso:
        raise HTTPException(status_code=404, detail="Post not found")

    source_language = req.source_language or post.get("language") or "auto"
    target_language = req.target_language

    if source_language == target_language:
        return {
            "title": post["title"],
            "excerpt": post.get("excerpt", ""),
            "content": post["content"],
            "source_language": source_language, 
            "target_language": target_language, 
            "cached": False
    }
    # Check cache first
    cached = await _get_cached(req.post_id, target_language)
    if cached:
        return {
            "title": cached["translated_text"]["title"],
            "excerpt": cached["translated_text"].get("excerpt", ""),
            "content": cached["translated_text"]["content"],
            "source_language": source_language,
            "target_language": target_language,
            "cached": True
        }

    # Translate each field (blocking call off the event loop)
    try:
        translated_title = await asyncio.to_thread(
            _call_translation_provider, post["title"], target_language, source_language
        )
        translated_excerpt = await asyncio.to_thread(
            _call_translation_provider, post.get("excerpt", ""), target_language, source_language
        ) if post.get("excerpt") else "" 
        translated_content = await asyncio.to_thread(
            _call_translation_provider, post["content"], target_language, source_language
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Translation failed")

    translated = {
        "title": translated_title,
        "excerpt": translated_excerpt,
        "content": translated_content
    }
    await _set_cache(req.post_id, target_language, translated, post["content"])

    return {
        "title": translated_title, 
        "excerpt": translated_excerpt, 
        "content": translated_content, 
        "source_language": source_language, 
        "target_language": target_language, 
        "cached": False
    }

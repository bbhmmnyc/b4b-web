import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, RedirectResponse
from database import db
from urllib.parse import urlparse

router = APIRouter()


def _allowed_redirect_hosts():
    raw_origins = [
        os.environ.get("SITE_URL", ""),
        *os.environ.get("PAYMENT_ALLOWED_ORIGINS", "").split(","),
    ]

    hosts = set()
    for origin in raw_origins:
        origin = origin.strip().rstrip("/")
        if not origin:
            continue
        parsed = urlparse(origin)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            hosts.add(parsed.netloc.lower())

    return hosts


@router.get("/track/open")
async def track_email_open(d: str, e: str):
    await db.email_events.insert_one({
        "digest_id": d,
        "email_hash": e,
        "event_type": "open",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

    return Response(
        content=pixel,
        media_type="image/png",
        headers={"Cache-Control": "no-cache, no-store"}
    )


@router.get("/track/click")
async def track_email_click(d: str, e: str, url: str):
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid redirect URL")

    allowed_hosts = _allowed_redirect_hosts()

    if allowed_hosts and parsed.netloc.lower() not in allowed_hosts:
        raise HTTPException(status_code=400, detail="Redirect URL is not allowed")

    await db.email_events.insert_one({
        "digest_id": d,
        "email_hash": e,
        "event_type": "click",
        "url": url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return RedirectResponse(url=url)

import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import hash_password, verify_password, create_token, require_user
from models import UserCreate, UserLogin
from email_service import send_email_notification

router = APIRouter()


def _clean_optional(value):
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _full_name(user: UserCreate):
    first_name = _clean_optional(user.first_name)
    last_name = _clean_optional(user.last_name)
    legacy_name = _clean_optional(user.name)
    if first_name and last_name:
        return f"{first_name} {last_name}", first_name, last_name
    if legacy_name:
        parts = legacy_name.split()
        inferred_first = first_name or parts[0]
        inferred_last = last_name or (" ".join(parts[1:]) if len(parts) > 1 else "")
        return legacy_name, inferred_first, inferred_last
    raise HTTPException(status_code=422, detail="First and last name are required")


async def _send_verification_email(user_doc):
    token = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=2)).isoformat()
    await db.email_verifications.insert_one({
        "token": token,
        "user_id": user_doc["id"],
        "email": user_doc["email"],
        "created_at": now.isoformat(),
        "expires_at": expires_at,
        "used": False,
    })
    site_url = (os.environ.get("SITE_URL") or "").rstrip("/")
    verify_url = f"{site_url}/verify-email?token={token}" if site_url else f"/verify-email?token={token}"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#0F172A;">Verify your Blogs 4 Blocks account</h2>
      <p style="color:#334155; line-height:1.6;">Thanks for registering. Please verify your email address so your account data stays accurate.</p>
      <p><a href="{verify_url}" style="background:#0A7A6A;color:white;padding:12px 18px;text-decoration:none;font-weight:700;">Verify Email</a></p>
      <p style="color:#64748B;font-size:12px;">This link expires in 48 hours.</p>
    </div>
    """
    await send_email_notification(user_doc["email"], "Verify your Blogs 4 Blocks account", html)


@router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email already registered")
    name, first_name, last_name = _full_name(user)
    published_name = _clean_optional(user.published_name)
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "first_name": first_name,
        "last_name": last_name,
        "published_name": published_name,
        "email": user.email,
        "password": hash_password(user.password),
        "city": user.city,
        "country": user.country,
        "is_admin": False,
        "is_approved": False,
        "is_suspended": False,
        "email_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    try:
        await _send_verification_email(user_doc)
    except Exception:
        pass
    token = create_token(user_doc["id"])
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["_id", "password"]}}


@router.post("/auth/login")
async def login(creds: UserLogin):
    user = await db.users.find_one({"email": creds.email}, {"_id": 0})
    if not user or not verify_password(creds.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("is_suspended"):
        raise HTTPException(status_code=403, detail="This account has been suspended.")
    token = create_token(user["id"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password"}}


@router.get("/auth/me")
async def get_me(user=Depends(require_user)):
    return {k: v for k, v in user.items() if k != "password"}


@router.get("/auth/verify-email")
async def verify_email(token: str):
    now_iso = datetime.now(timezone.utc).isoformat()
    record = await db.email_verifications.find_one(
        {"token": token, "used": False, "expires_at": {"$gt": now_iso}},
        {"_id": 0},
    )
    if not record:
        raise HTTPException(status_code=400, detail="Verification link is invalid or expired")
    await db.users.update_one(
        {"id": record["user_id"]},
        {"$set": {"email_verified": True, "email_verified_at": now_iso}},
    )
    await db.email_verifications.update_one({"token": token}, {"$set": {"used": True, "used_at": now_iso}})
    return {"message": "Email verified. Your account is ready for admin review before blog posting."}

import os
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Header, HTTPException
from database import db

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    if os.environ.get("ENVIRONMENT", "").lower() in {"test", "development"}:
        JWT_SECRET = "development-only-change-me"
    else:
        raise RuntimeError("JWT_SECRET must be set in production")

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "exp": now + timedelta(days=30),
        "iat": now,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


async def get_current_user(authorization: Optional[str] = Header(None)):
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    except jwt.PyJWTError:
        return None
    except Exception:
        logger.exception("Unexpected authentication lookup failure")
        return None


async def require_user(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def require_admin(authorization: Optional[str] = Header(None)):
    user = await require_user(authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

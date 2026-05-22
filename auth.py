import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from database import db
from auth import hash_password, verify_password, create_token, require_user
from models import UserCreate, UserLogin

router = APIRouter()


@router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "city": user.city,
        "country": user.country,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"])
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["_id", "password"]}}


@router.post("/auth/login")
async def login(creds: UserLogin):
    user = await db.users.find_one({"email": creds.email}, {"_id": 0})
    if not user or not verify_password(creds.password, user["password"]):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password"}}


@router.get("/auth/me")
async def get_me(user=Depends(require_user)):
    return {k: v for k, v in user.items() if k != "password"}

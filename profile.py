from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from database import db
from auth import require_user
from models import ProfileColors

router = APIRouter()


@router.get("/profile/posts")
async def get_user_posts(user=Depends(require_user)):
    posts = await db.posts.find({"author_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts


@router.get("/profile/interactions")
async def get_user_interactions(user=Depends(require_user)):
    interactions = await db.user_interactions.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    liked_posts = await db.user_likes.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    post_ids = set()
    for i in interactions:
        post_ids.add(i["post_id"])
    for l in liked_posts:
        post_ids.add(l["post_id"])
    if not post_ids:
        return []
    posts = await db.posts.find({"id": {"$in": list(post_ids)}, "author_id": {"$ne": user["id"]}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts


@router.get("/profile/colors")
async def get_profile_colors(user=Depends(require_user)):
    prefs = await db.user_prefs.find_one({"user_id": user["id"]}, {"_id": 0})
    if prefs:
        return {"my_posts_color": prefs.get("my_posts_color", "#3B82F6"), "interacted_color": prefs.get("interacted_color", "#22C55E")}
    return {"my_posts_color": "#3B82F6", "interacted_color": "#22C55E"}


@router.put("/profile/colors")
async def update_profile_colors(colors: ProfileColors, user=Depends(require_user)):
    await db.user_prefs.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "my_posts_color": colors.my_posts_color, "interacted_color": colors.interacted_color, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Colors updated", "my_posts_color": colors.my_posts_color, "interacted_color": colors.interacted_color}

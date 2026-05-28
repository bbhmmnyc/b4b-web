import re
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from database import db
from auth import get_current_user
from models import CommentCreate
from email_service import notify_post_author_of_comment
from websocket_manager import ws_manager

router = APIRouter()


@router.get("/users/search")
async def search_users(q: str, post_id: Optional[str] = None, limit: int = 8):
    """Search users by name for @mention autocomplete. Also includes post author & commenters."""
    if not q or len(q.strip()) < 1:
        return []
    q = q.strip()[:80]
    limit = max(1, min(limit, 20))
    results = []
    seen_ids = set()

    # If post_id provided, include the post author + active commenters first
    if post_id:
        post = await db.posts.find_one({"id": post_id}, {"_id": 0, "author_name": 1, "author_id": 1, "author_city": 1})
        if post and post.get("author_id"):
            author = await db.users.find_one({"id": post["author_id"]}, {"_id": 0, "id": 1, "name": 1, "city": 1})
            if author and author["name"].lower().startswith(q.lower()):
                results.append({"id": author["id"], "name": author["name"], "city": author.get("city", "")})
                seen_ids.add(author["id"])
        # Get commenters on this post
        comments = await db.comments.find({"post_id": post_id, "author_id": {"$ne": None}}, {"_id": 0, "author_id": 1, "author_name": 1}).to_list(100)
        for c in comments:
            if c.get("author_id") and c["author_id"] not in seen_ids and c.get("author_name", "").lower().startswith(q.lower()):
                user_doc = await db.users.find_one({"id": c["author_id"]}, {"_id": 0, "id": 1, "name": 1, "city": 1})
                if user_doc:
                    results.append({"id": user_doc["id"], "name": user_doc["name"], "city": user_doc.get("city", "")})
                    seen_ids.add(user_doc["id"])
            if len(results) >= limit:
                break

    # General user search by name prefix
    if len(results) < limit:
        remaining = limit - len(results)
        users = await db.users.find(
            {"name": {"$regex": f"^{re.escape(q)}", "$options": "i"}},
            {"_id": 0, "id": 1, "name": 1, "city": 1}
        ).limit(remaining + len(seen_ids)).to_list(remaining + len(seen_ids))
        for u in users:
            if u["id"] not in seen_ids:
                results.append({"id": u["id"], "name": u["name"], "city": u.get("city", "")})
                seen_ids.add(u["id"])
            if len(results) >= limit:
                break

    return results


@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return comments


@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, comment: CommentCreate, user=Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Extract @mentions from content
    mentions = re.findall(r'@(\w[\w\s]*?)(?=\s@|\s|$|[.,!?])', comment.content)
    mentioned_user_ids = []
    for mention_name in mentions:
        mentioned_user = await db.users.find_one({"name": {"$regex": f"^{re.escape(mention_name.strip())}$", "$options": "i"}}, {"_id": 0, "id": 1, "name": 1})
        if mentioned_user:
            mentioned_user_ids.append(mentioned_user["id"])

    comment_doc = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "content": comment.content,
       author_name = comment.author_name or (user["name"] if user else None)
       author_city = comment.author_city or (user["city"] if user else "")
       author_country = comment.author_country or (user["country"] if user else "")

if not author_name:
    raise HTTPException(status_code=400, detail="Comment author name is required")

if not user and not author_city:
    raise HTTPException(status_code=400, detail="Guest comments require city")

comment_doc = {
    "id": str(uuid.uuid4()),
    "post_id": post_id,
    "content": comment.content,
    "author_name": author_name,
    "author_city": author_city,
    "author_country": author_country or "Unknown",
    "author_id": user["id"] if user else None,
    "is_guest": user is None,
    "mentions": mentioned_user_ids,
    "created_at": datetime.now(timezone.utc).isoformat()
}
        "author_id": user["id"] if user else None,
        "is_guest": user is None,
        "mentions": mentioned_user_ids,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment_doc)
    # Track interaction
    if user:
        await db.user_interactions.update_one(
            {"user_id": user["id"], "post_id": post_id},
            {"$set": {"user_id": user["id"], "post_id": post_id, "type": "comment", "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    # Real-time broadcast
    safe_comment = {k: v for k, v in comment_doc.items() if k != "_id"}
    await ws_manager.broadcast(post_id, {"type": "new_comment", "comment": safe_comment})
    # Email notification to post author
    try:
        await notify_post_author_of_comment(post, comment_doc)
    except Exception:
        pass
    return safe_comment


@router.get("/posts/{post_id}/comments/live")
async def get_comments_live(post_id: str):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return comments

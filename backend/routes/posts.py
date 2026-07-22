import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from database import db
from auth import get_current_user, require_user
from models import PostCreate, PostUpdate
from email_service import notify_new_post_to_all_users

router = APIRouter()


def public_author_name(user):
    return (user.get("published_name") or user.get("name") or "").strip()


def guest_content_has_links(content: str) -> bool:
    return bool(re.search(r'(<a\b|href\s*=|https?://|www\.)', content or "", re.IGNORECASE))


@router.get("/posts")
async def get_posts(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 12,
    skip: int = 0,
    page: int = 1,
    include_expired: bool = False,
):
    limit = max(1, min(limit, 50))
    page = max(1, page)
    skip = max(0, skip)
    filters = []

    now_iso = datetime.now(timezone.utc).isoformat()
    if not include_expired:
        filters.append({"$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]})
    if category:
        filters.append({"category_slug": category})
    if subcategory:
        filters.append({"subcategory": subcategory})
    if search:
        safe_search = re.escape(search.strip()[:80])
        filters.append({"$or": [
            {"title": {"$regex": safe_search, "$options": "i"}},
            {"content": {"$regex": safe_search, "$options": "i"}},
            {"tags": {"$regex": safe_search, "$options": "i"}},
            {"author_name": {"$regex": safe_search, "$options": "i"}},
            {"author_city": {"$regex": safe_search, "$options": "i"}},
            {"author_country": {"$regex": safe_search, "$options": "i"}},
            {"category_slug": {"$regex": safe_search, "$options": "i"}},
        ]})

    query = {"$and": filters} if filters else {}
    actual_skip = (page - 1) * limit if page > 1 else skip
    total = await db.posts.count_documents(query)
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).skip(actual_skip).limit(limit).to_list(limit)
    pages = max(1, (total + limit - 1) // limit)

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "pages": pages,
        "total_pages": pages,
        "per_page": limit,
    }


@router.get("/posts/popular/list")
async def get_popular_posts(limit: int = 6):
    limit = max(1, min(limit, 20))
    now_iso = datetime.now(timezone.utc).isoformat()
    posts = await db.posts.find(
        {"$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]},
        {"_id": 0}
    ).sort([("views", -1), ("likes", -1)]).limit(limit).to_list(limit)
    return posts


@router.get("/posts/featured/list")
async def get_featured_posts(limit: int = 8):
    limit = max(1, min(limit, 20))
    now_iso = datetime.now(timezone.utc).isoformat()
    posts = await db.posts.find(
        {
            "is_featured": True,
            "$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return posts


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.posts.update_one({"id": post_id}, {"$inc": {"views": 1}})
    post["views"] = post.get("views", 0) + 1
    return post


@router.get("/posts/{post_id}/related")
async def get_related_posts(post_id: str, limit: int = 3):
    limit = max(1, min(limit, 12))
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        return []
    now_iso = datetime.now(timezone.utc).isoformat()
    related = await db.posts.find(
        {"category_slug": post["category_slug"], "id": {"$ne": post_id}, "$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]},
        {"_id": 0}
    ).sort("likes", -1).limit(limit).to_list(limit)
    if len(related) < limit:
        more = await db.posts.find(
            {"id": {"$ne": post_id, "$nin": [r["id"] for r in related]}, "$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]},
            {"_id": 0}
        ).sort("likes", -1).limit(limit - len(related)).to_list(limit - len(related))
        related.extend(more)
    return related


@router.post("/posts")
async def create_post(post: PostCreate, user=Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    is_guest = post.guest_author is not None and user is None
    post_doc = {
        "id": post_id,
        "title": post.title,
        "content": post.content,
        "excerpt": post.excerpt,
        "category_slug": post.category_slug,
        "subcategory": post.subcategory,
        "tags": post.tags,
        "cover_image": post.cover_image,
        "language": post.language or "en",
        "co_authors": [],
        "is_guest": is_guest,
        "likes": 0,
        "views": 0,
        "created_at": now,
        "updated_at": now
    }
    if is_guest:
        if guest_content_has_links(post.content):
            raise HTTPException(status_code=400, detail="Guest posts cannot include links. Please register or sign in to publish posts with links.")
        post_doc["author_name"] = post.guest_author.name
        post_doc["author_city"] = post.guest_author.city
        post_doc["author_country"] = post.guest_author.country
        post_doc["author_id"] = None
        post_doc["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    elif user:
        if user.get("is_suspended"):
            raise HTTPException(status_code=403, detail="This account has been suspended.")
        if not user.get("email_verified") and not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Please verify your email before publishing posts.")
        if not user.get("is_approved") and not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Your account is registered, but blog posting requires admin approval. You can still comment while approval is pending.")
        post_doc["author_name"] = public_author_name(user)
        post_doc["author_registered_name"] = user.get("name", "")
        post_doc["author_city"] = user["city"]
        post_doc["author_country"] = user["country"]
        post_doc["author_id"] = user["id"]
        post_doc["expires_at"] = None
        # Resolve co-authors (must be accepted partners)
        if post.co_authors:
            co_author_docs = []
            for ca_id in post.co_authors:
                partnership = await db.partnerships.find_one({
                    "status": "accepted",
                    "$or": [
                        {"requester_id": user["id"], "target_id": ca_id},
                        {"requester_id": ca_id, "target_id": user["id"]}
                    ]
                })
                if partnership:
                    ca_user = await db.users.find_one({"id": ca_id}, {"_id": 0, "id": 1, "name": 1, "published_name": 1, "city": 1, "country": 1})
                    if ca_user:
                        co_author_docs.append({"id": ca_user["id"], "name": public_author_name(ca_user), "registered_name": ca_user.get("name", ""), "city": ca_user["city"], "country": ca_user["country"]})
            post_doc["co_authors"] = co_author_docs
    else:
        raise HTTPException(status_code=400, detail="Must provide guest author info or be logged in")
    await db.posts.insert_one(post_doc)
    if user and not is_guest:
        try:
            await notify_new_post_to_all_users(post_doc)
        except Exception:
            pass
    return {k: v for k, v in post_doc.items() if k != "_id"}


@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user=Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if user:
        if user.get("is_suspended"):
            raise HTTPException(status_code=403, detail="This account has been suspended.")
        existing = await db.user_likes.find_one({"user_id": user["id"], "post_id": post_id})
        if existing:
            await db.user_likes.delete_one({"user_id": user["id"], "post_id": post_id})
            await db.posts.update_one({"id": post_id}, {"$inc": {"likes": -1}})
            updated = await db.posts.find_one({"id": post_id}, {"_id": 0, "likes": 1})
            return {"likes": max(0, updated["likes"]), "liked": False}
        else:
            await db.user_likes.insert_one({"user_id": user["id"], "post_id": post_id, "created_at": datetime.now(timezone.utc).isoformat()})
            await db.posts.update_one({"id": post_id}, {"$inc": {"likes": 1}})
            updated = await db.posts.find_one({"id": post_id}, {"_id": 0, "likes": 1})
            return {"likes": updated["likes"], "liked": True}
    else:
        raise HTTPException(status_code=401, detail="Sign in to like posts")


@router.get("/posts/{post_id}/liked")
async def check_liked(post_id: str, user=Depends(get_current_user)):
    if not user:
        return {"liked": False}
    existing = await db.user_likes.find_one({"user_id": user["id"], "post_id": post_id})
    return {"liked": existing is not None}


@router.put("/posts/{post_id}")
async def update_post(post_id: str, update: PostUpdate, user=Depends(require_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("author_id") != user["id"] and not user.get("is_admin"):
        co_author_ids = [ca.get("id") for ca in post.get("co_authors", []) if isinstance(ca, dict)]
        if user["id"] not in co_author_ids:
            raise HTTPException(status_code=403, detail="You can only edit your own posts")
    update_fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if "co_authors" in update_fields and isinstance(update_fields["co_authors"], list):
        co_author_docs = []
        for ca_id in update_fields["co_authors"]:
            if isinstance(ca_id, str):
                ca_user = await db.users.find_one({"id": ca_id}, {"_id": 0, "id": 1, "name": 1, "published_name": 1, "city": 1, "country": 1})
                if ca_user:
                    co_author_docs.append({"id": ca_user["id"], "name": public_author_name(ca_user), "registered_name": ca_user.get("name", ""), "city": ca_user["city"], "country": ca_user["country"]})
        update_fields["co_authors"] = co_author_docs
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.posts.update_one({"id": post_id}, {"$set": update_fields})
    updated = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return updated


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user=Depends(require_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("author_id") != user["id"] and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    await db.posts.delete_one({"id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted"}

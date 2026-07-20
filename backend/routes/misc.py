import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from auth import require_admin  
from database import db

router = APIRouter()


@router.post("/seed")
async def seed_data(user=Depends(require_admin)):
    from seed_data import SEED_POSTS
    count = await db.posts.count_documents({})
    if count > 0:
        return {"message": f"Already have {count} posts, skipping seed"}
    now = datetime.now(timezone.utc)
    for i, post_data in enumerate(SEED_POSTS):
        post_doc = {
            "id": str(uuid.uuid4()),
            "title": post_data["title"],
            "content": post_data["content"],
            "excerpt": post_data["excerpt"],
            "category_slug": post_data["category_slug"],
            "subcategory": post_data.get("subcategory"),
            "tags": post_data["tags"],
            "author_name": post_data["author_name"],
            "author_city": post_data["author_city"],
            "author_country": post_data["author_country"],
            "author_id": None,
            "is_guest": False,
            "is_seed": True,
            "likes": (i + 1) * 7,
            "views": (i + 1) * 23,
            "created_at": (now - timedelta(days=i * 3)).isoformat(),
            "updated_at": (now - timedelta(days=i * 3)).isoformat(),
            "expires_at": None
        }
        await db.posts.insert_one(post_doc)
    return {"message": f"Seeded {len(SEED_POSTS)} posts"}


@router.get("/stats")
async def get_stats():
    total_posts = await db.posts.count_documents({})
    total_comments = await db.comments.count_documents({})
    total_registered_users = await db.users.count_documents({})
    contributor_ids = await db.posts.distinct("author_id", {"author_id": {"$nin": [None, ""]}})
    total_contributors = len(contributor_ids)
    user_countries = await db.users.distinct("country", {"country": {"$nin": [None, "", "Unknown"]}})
    post_countries = await db.posts.distinct("author_country", {"author_country": {"$nin": [None, "", "Unknown"]}})
    comment_countries = await db.comments.distinct("author_country", {"author_country": {"$nin": [None, "", "Unknown"]}})
    countries = {c.strip() for c in [*user_countries, *post_countries, *comment_countries] if isinstance(c, str) and c.strip()}
    return {
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_users": total_contributors,
        "total_registered_users": total_registered_users,
        "total_contributors": total_contributors,
        "total_countries": len(countries),
    }

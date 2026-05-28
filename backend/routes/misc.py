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
    total_users = await db.users.count_documents({})
    countries_pipeline = [{"$group": {"_id": "$author_country"}}, {"$count": "count"}]
    countries_result = await db.posts.aggregate(countries_pipeline).to_list(1)
    total_countries = countries_result[0]["count"] if countries_result else 0
    return {"total_posts": total_posts, "total_comments": total_comments, "total_users": total_users, "total_countries": total_countries}

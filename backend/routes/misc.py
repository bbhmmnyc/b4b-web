import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from auth import require_admin  
from database import db

router = APIRouter()


def active_post_filter(now_iso: str):
    return {"$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]}


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
    now_iso = datetime.now(timezone.utc).isoformat()
    post_filter = active_post_filter(now_iso)
    total_posts = await db.posts.count_documents(post_filter)
    total_comments = await db.comments.count_documents({})
    total_registered_users = await db.users.count_documents({})

    published_posts = await db.posts.find(
        post_filter,
        {"_id": 0, "author_id": 1, "author_name": 1, "author_city": 1, "author_country": 1}
    ).to_list(5000)
    contributors = set()
    for post in published_posts:
        if post.get("author_id"):
            contributors.add(f"user:{post['author_id']}")
        else:
            name = (post.get("author_name") or "").strip().lower()
            city = (post.get("author_city") or "").strip().lower()
            country = (post.get("author_country") or "").strip().lower()
            if name:
                contributors.add(f"author:{name}|{city}|{country}")
    total_contributors = len(contributors)

    user_countries = await db.users.distinct("country", {"country": {"$nin": [None, "", "Unknown"]}})
    post_countries = await db.posts.distinct("author_country", {**post_filter, "author_country": {"$nin": [None, "", "Unknown"]}})
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


@router.get("/regions")
async def get_regions(limit: int = 24):
    limit = max(1, min(limit, 100))
    now_iso = datetime.now(timezone.utc).isoformat()
    post_filter = active_post_filter(now_iso)
    posts = await db.posts.find(
        post_filter,
        {"_id": 0, "author_id": 1, "author_name": 1, "author_city": 1, "author_country": 1, "category_slug": 1}
    ).to_list(5000)
    categories = await db.categories.find({}, {"_id": 0, "slug": 1, "name": 1}).to_list(500)
    category_names = {cat["slug"]: cat["name"] for cat in categories}

    grouped = {}
    for post in posts:
        city = (post.get("author_city") or "").strip()
        country = (post.get("author_country") or "").strip()
        if not city or city.lower() == "unknown":
            continue
        key = f"{city.lower()}|{country.lower()}"
        if key not in grouped:
            grouped[key] = {
                "city": city,
                "country": country,
                "post_count": 0,
                "contributors": set(),
                "categories": {},
            }
        grouped[key]["post_count"] += 1
        category_slug = post.get("category_slug") or "all"
        grouped[key]["categories"][category_slug] = grouped[key]["categories"].get(category_slug, 0) + 1
        if post.get("author_id"):
            grouped[key]["contributors"].add(f"user:{post['author_id']}")
        else:
            name = (post.get("author_name") or "").strip().lower()
            if name:
                grouped[key]["contributors"].add(f"author:{name}|{key}")

    regions = []
    for region in grouped.values():
        top_category_slug = sorted(region["categories"].items(), key=lambda item: item[1], reverse=True)[0][0]
        top_category_name = category_names.get(top_category_slug, top_category_slug.replace("-", " ").title())
        regions.append({
            "city": region["city"],
            "country": region["country"],
            "post_count": region["post_count"],
            "contributor_count": len(region["contributors"]),
            "top_category_slug": top_category_slug,
            "top_category_name": top_category_name,
            "label": f"{region['city']} — {top_category_name}",
        })

    regions.sort(key=lambda r: (r["post_count"], r["contributor_count"], r["city"]), reverse=True)
    return regions[:limit]

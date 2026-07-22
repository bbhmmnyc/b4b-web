import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from database import db
from models import AdInquiry

router = APIRouter()


@router.post("/advertise/inquiry")
async def submit_ad_inquiry(inquiry: AdInquiry):
    doc = {
        "id": str(uuid.uuid4()),
        "company_name": inquiry.company_name,
        "contact_name": inquiry.contact_name,
        "email": inquiry.email,
        "website": inquiry.website,
        "budget_range": inquiry.budget_range,
        "message": inquiry.message,
        "preferred_categories": inquiry.preferred_categories,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ad_inquiries.insert_one(doc)
    return {"message": "Thank you! We'll be in touch within 48 hours.", "id": doc["id"]}


@router.get("/advertise/stats")
async def get_advertise_stats():
    now_iso = datetime.now(timezone.utc).isoformat()
    active_post_filter = {"$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]}
    total_posts = await db.posts.count_documents(active_post_filter)
    total_comments = await db.comments.count_documents({})
    newsletter_subs = await db.newsletter.count_documents({"active": True})

    published_posts = await db.posts.find(
        active_post_filter,
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

    user_countries = await db.users.distinct("country", {"country": {"$nin": [None, "", "Unknown"]}})
    post_countries = await db.posts.distinct("author_country", {**active_post_filter, "author_country": {"$nin": [None, "", "Unknown"]}})
    comment_countries = await db.comments.distinct("author_country", {"author_country": {"$nin": [None, "", "Unknown"]}})
    countries = {c.strip() for c in [*user_countries, *post_countries, *comment_countries] if isinstance(c, str) and c.strip()}

    return {
        "total_posts": total_posts,
        "total_users": len(contributors),
        "total_contributors": len(contributors),
        "total_comments": total_comments,
        "newsletter_subscribers": newsletter_subs,
        "total_countries": len(countries),
    }

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
    total_posts = await db.posts.count_documents({})
    total_users = await db.users.count_documents({})
    total_comments = await db.comments.count_documents({})
    newsletter_subs = await db.newsletter.count_documents({"active": True})
    countries_pipeline = [{"$group": {"_id": "$author_country"}}, {"$count": "count"}]
    countries_result = await db.posts.aggregate(countries_pipeline).to_list(1)
    total_countries = countries_result[0]["count"] if countries_result else 0
    return {
        "total_posts": total_posts,
        "total_users": total_users,
        "total_comments": total_comments,
        "newsletter_subscribers": newsletter_subs,
        "total_countries": total_countries,
    }

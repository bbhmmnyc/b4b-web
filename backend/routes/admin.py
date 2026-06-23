import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from database import db
from auth import require_user, require_admin
from models import AdminSetupRequest

router = APIRouter()


@router.post("/admin/self-promote")
async def self_promote_to_admin(req: AdminSetupRequest, user=Depends(require_user)):
    admin_key = os.environ.get("ADMIN_SETUP_KEY")
    if not admin_key:
        raise HTTPException(status_code=500, detail="Admin setup is not configured")
    if req.secret_key != admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin setup key")
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_admin": True}})
    return {"message": "You are now an admin! Refresh the page to access the admin panel.", "is_admin": True}


@router.get("/admin/stats")
async def admin_stats(user=Depends(require_admin)):
    now = datetime.now(timezone.utc)
    total_posts = await db.posts.count_documents({})
    total_comments = await db.comments.count_documents({})
    total_users = await db.users.count_documents({})
    total_categories = await db.categories.count_documents({"status": "approved"})
    pending_categories = await db.categories.count_documents({"status": "pending"})
    one_week_ago = (now - timedelta(days=7)).isoformat()
    new_posts_week = await db.posts.count_documents({"created_at": {"$gte": one_week_ago}})
    new_users_week = await db.users.count_documents({"created_at": {"$gte": one_week_ago}})
    recent_posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    recent_comments = await db.comments.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    guest_posts = await db.posts.count_documents({"is_guest": True})
    return {
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_users": total_users,
        "total_categories": total_categories,
        "pending_categories": pending_categories,
        "new_posts_week": new_posts_week,
        "new_users_week": new_users_week,
        "guest_posts": guest_posts,
        "recent_posts": recent_posts,
        "recent_comments": recent_comments
    }


@router.delete("/admin/posts/expired-guests")
async def clear_expired_guest_posts(user=Depends(require_admin)):
    now_iso = datetime.now(timezone.utc).isoformat()
    result = await db.posts.delete_many({"is_guest": True, "expires_at": {"$lte": now_iso}})
    return {"message": f"Deleted {result.deleted_count} expired guest posts", "deleted": result.deleted_count}


@router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, user=Depends(require_admin)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted by admin"}


@router.delete("/admin/comments/{comment_id}")
async def admin_delete_comment(comment_id: str, user=Depends(require_admin)):
    result = await db.comments.delete_one({"id": comment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted by admin"}


@router.get("/admin/users")
async def admin_list_users(user=Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    return users


@router.post("/admin/send-digest")
async def send_weekly_digest_endpoint(user=Depends(require_admin)):
    from routes.newsletter import _send_weekly_digest
    result = await _send_weekly_digest()
    return result


@router.get("/admin/digest-status")
async def get_digest_status(user=Depends(require_admin)):
    last_digest = await db.digest_log.find_one(
        {"status": {"$in": ["sent", "skipped"]}},
        {"_id": 0},
        sort=[("sent_at", -1)]
    )
    active_subscribers = await db.newsletter.count_documents({"active": True})
    registered_users = await db.users.count_documents({})
    total_digests_sent = await db.digest_log.count_documents({"status": "sent"})
    recent_logs = await db.digest_log.find({}, {"_id": 0}).sort("sent_at", -1).limit(5).to_list(5)
    return {
        "last_digest": last_digest,
        "active_subscribers": active_subscribers,
        "registered_users": registered_users,
        "total_audience": active_subscribers + registered_users,
        "total_digests_sent": total_digests_sent,
        "schedule": "Every Monday at 9:00 AM UTC",
        "recent_logs": recent_logs
    }


@router.get("/admin/subscribers")
async def get_subscribers(user=Depends(require_admin)):
    subscribers = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(5000)
    return subscribers


@router.get("/admin/analytics")
async def get_email_analytics(user=Depends(require_admin)):
    total_opens = await db.email_events.count_documents({"event_type": "open"})
    total_clicks = await db.email_events.count_documents({"event_type": "click"})
    unique_opens_pipeline = [{"$match": {"event_type": "open"}}, {"$group": {"_id": "$email_hash"}}, {"$count": "count"}]
    unique_clicks_pipeline = [{"$match": {"event_type": "click"}}, {"$group": {"_id": "$email_hash"}}, {"$count": "count"}]
    unique_opens_res = await db.email_events.aggregate(unique_opens_pipeline).to_list(1)
    unique_clicks_res = await db.email_events.aggregate(unique_clicks_pipeline).to_list(1)
    unique_opens = unique_opens_res[0]["count"] if unique_opens_res else 0
    unique_clicks = unique_clicks_res[0]["count"] if unique_clicks_res else 0
    total_sent = await db.digest_log.count_documents({"status": "sent"})
    total_recipients = 0
    sent_logs = await db.digest_log.find({"status": "sent"}, {"_id": 0, "recipients": 1}).to_list(100)
    for log in sent_logs:
        total_recipients += log.get("recipients", 0)
    digest_logs = await db.digest_log.find({"status": "sent"}, {"_id": 0}).sort("sent_at", -1).limit(10).to_list(10)
    digest_breakdown = []
    for dl in digest_logs:
        d_id = dl.get("sent_at", "")[:10]
        opens = await db.email_events.count_documents({"digest_id": d_id, "event_type": "open"})
        clicks = await db.email_events.count_documents({"digest_id": d_id, "event_type": "click"})
        digest_breakdown.append({
            "date": dl["sent_at"],
            "recipients": dl.get("recipients", 0),
            "opens": opens,
            "clicks": clicks,
            "open_rate": round(opens / max(dl.get("recipients", 1), 1) * 100, 1),
            "click_rate": round(clicks / max(dl.get("recipients", 1), 1) * 100, 1)
        })
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    new_subs = await db.newsletter.count_documents({"subscribed_at": {"$gte": thirty_days_ago}})
    total_active = await db.newsletter.count_documents({"active": True})
    total_inactive = await db.newsletter.count_documents({"active": False})
    open_rate = round(unique_opens / max(total_recipients, 1) * 100, 1)
    click_rate = round(unique_clicks / max(total_recipients, 1) * 100, 1)
    return {
        "total_opens": total_opens,
        "total_clicks": total_clicks,
        "unique_opens": unique_opens,
        "unique_clicks": unique_clicks,
        "total_digests_sent": total_sent,
        "total_recipients": total_recipients,
        "open_rate": open_rate,
        "click_rate": click_rate,
        "digest_breakdown": digest_breakdown,
        "subscriber_growth_30d": new_subs,
        "active_subscribers": total_active,
        "inactive_subscribers": total_inactive
    }



@router.get("/admin/campaigns")
async def get_campaign_analytics(user=Depends(require_admin)):
    """Ad campaign analytics — featured/sponsored post performance + revenue."""
    # Get all bookings and transactions
    bookings = await db.ad_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    transactions = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

    # Revenue stats
    paid_txns = [t for t in transactions if t.get("payment_status") == "paid"]
    total_revenue = sum(t.get("total_price", 0) for t in paid_txns)
    pending_txns = [t for t in transactions if t.get("payment_status") == "pending"]

    # Featured/sponsored post performance
    featured_posts = await db.posts.find({"is_featured": True}, {"_id": 0}).to_list(100)
    sponsored_posts = await db.posts.find({"is_sponsored": True}, {"_id": 0}).to_list(100)

    featured_views = sum(p.get("views", 0) for p in featured_posts)
    featured_likes = sum(p.get("likes", 0) for p in featured_posts)
    sponsored_views = sum(p.get("views", 0) for p in sponsored_posts)
    sponsored_likes = sum(p.get("likes", 0) for p in sponsored_posts)

    # Get comment counts for featured/sponsored posts
    featured_ids = [p["id"] for p in featured_posts]
    sponsored_ids = [p["id"] for p in sponsored_posts]
    featured_comments = await db.comments.count_documents({"post_id": {"$in": featured_ids}}) if featured_ids else 0
    sponsored_comments = await db.comments.count_documents({"post_id": {"$in": sponsored_ids}}) if sponsored_ids else 0

    # Inquiries pipeline
    inquiries = await db.ad_inquiries.find({}, {"_id": 0}).to_list(100)
    inquiry_pipeline = {
        "new": len([i for i in inquiries if i.get("status") == "new"]),
        "contacted": len([i for i in inquiries if i.get("status") == "contacted"]),
        "closed": len([i for i in inquiries if i.get("status") == "closed"]),
    }

    return {
        "revenue": {
            "total": total_revenue,
            "paid_count": len(paid_txns),
            "pending_count": len(pending_txns),
        },
        "featured": {
            "count": len(featured_posts),
            "total_views": featured_views,
            "total_likes": featured_likes,
            "total_comments": featured_comments,
            "posts": [{
                "id": p["id"],
                "title": p["title"],
                "category": p.get("category_slug", ""),
                "views": p.get("views", 0),
                "likes": p.get("likes", 0),
                "author": p.get("author_name", ""),
                "is_sponsored": p.get("is_sponsored", False),
                "sponsor_name": p.get("sponsor_name", ""),
            } for p in featured_posts],
        },
        "sponsored": {
            "count": len(sponsored_posts),
            "total_views": sponsored_views,
            "total_likes": sponsored_likes,
            "total_comments": sponsored_comments,
        },
        "inquiry_pipeline": inquiry_pipeline,
        "recent_bookings": bookings[:10],
        "recent_transactions": [{
            "id": t["id"],
            "booking_id": t.get("booking_id", ""),
            "advertiser": t.get("advertiser", ""),
            "ad_size": t.get("ad_size", ""),
            "frequency": t.get("frequency", ""),
            "placement": t.get("placement", ""),
            "total_price": t.get("total_price", 0),
            "payment_status": t.get("payment_status", ""),
            "created_at": t.get("created_at", ""),
        } for t in transactions[:20]],
    }



@router.put("/admin/users/{user_id}/toggle-admin")
async def toggle_user_admin(user_id: str, admin=Depends(require_admin)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot change your own admin status")

    new_status = not target.get("is_admin", False)

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": new_status}}
    )

    return {
        "message": f"User {'promoted to' if new_status else 'removed from'} admin",
        "is_admin": new_status
    }


@router.put("/admin/posts/{post_id}/sponsor")
async def set_sponsor(post_id: str, sponsor: dict, user=Depends(require_admin)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if sponsor.get("remove"):
        await db.posts.update_one({"id": post_id}, {"$set": {"is_sponsored": False}, "$unset": {"sponsor_name": "", "sponsor_url": "", "sponsor_logo": ""}})
        return {"is_sponsored": False, "message": "Sponsorship removed"}
    await db.posts.update_one({"id": post_id}, {"$set": {
        "is_sponsored": True,
        "sponsor_name": sponsor.get("sponsor_name", ""),
        "sponsor_url": sponsor.get("sponsor_url", ""),
        "sponsor_logo": sponsor.get("sponsor_logo", ""),
    }})
    return {"is_sponsored": True, "message": "Sponsor info updated"}


@router.get("/admin/ad-inquiries")
async def get_ad_inquiries(user=Depends(require_admin)):
    inquiries = await db.ad_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return inquiries


@router.put("/admin/ad-inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, body: dict, user=Depends(require_admin)):
    result = await db.ad_inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {"status": body.get("status", "reviewed"), "reviewed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Inquiry status updated"}

import os
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from database import db
from models import NewsletterSubscribe
from email_service import send_email_notification

router = APIRouter()


@router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        if existing.get("active"):
            return {"message": "You're already subscribed!", "subscribed": True}
        await db.newsletter.update_one({"email": data.email}, {"$set": {"active": True}})
        return {"message": "Welcome back! You've been re-subscribed.", "subscribed": True}
    await db.newsletter.insert_one({
        "email": data.email,
        "name": data.name or "",
        "active": True,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "You're subscribed to the weekly digest!", "subscribed": True}


@router.post("/newsletter/unsubscribe")
async def newsletter_unsubscribe(data: NewsletterSubscribe):
    result = await db.newsletter.update_one({"email": data.email}, {"$set": {"active": False}})
    if result.matched_count == 0:
        return {"message": "Email not found in subscribers", "unsubscribed": False}
    return {"message": "You've been unsubscribed", "unsubscribed": True}


async def _send_weekly_digest():
    """Generate and send weekly digest to all active subscribers"""
    one_week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()
    digest_id = now_iso[:10]
    site_url = os.environ.get('SITE_URL', '')

    top_posts = await db.posts.find(
        {"created_at": {"$gte": one_week_ago}, "$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]},
        {"_id": 0}
    ).sort([("likes", -1), ("views", -1)]).limit(5).to_list(5)

    if not top_posts:
        await db.digest_log.insert_one({
            "sent_at": now_iso,
            "recipients": 0,
            "posts_included": 0,
            "status": "skipped",
            "reason": "No new posts this week"
        })
        return {"message": "No posts from this week to include in digest", "sent": 0}

    subscribers = await db.newsletter.find({"active": True}, {"_id": 0}).to_list(5000)
    all_users = await db.users.find({}, {"_id": 0, "email": 1, "name": 1}).to_list(1000)

    subscriber_emails = set()
    for s in subscribers:
        subscriber_emails.add(s["email"])
    for u in all_users:
        subscriber_emails.add(u["email"])

    post_count = await db.posts.count_documents({"created_at": {"$gte": one_week_ago}})
    new_comments = await db.comments.count_documents({"created_at": {"$gte": one_week_ago}})

    sent_count = 0
    errors = 0
    for email in subscriber_emails:
        email_hash = hashlib.md5(email.encode()).hexdigest()[:12]

        posts_html = ""
        for p in top_posts:
            post_url = f"{site_url}/post/{p['id']}" if site_url else f"/post/{p['id']}"
            tracked_url = f"{site_url}/api/track/click?d={digest_id}&e={email_hash}&url={post_url}" if site_url else post_url
            posts_html += f"""
            <a href="{tracked_url}" style="text-decoration: none; display: block;">
              <div style="background: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #3B82F6;">
                <h3 style="color: #0F172A; font-size: 15px; margin: 0 0 6px 0; font-weight: 700;">{p['title']}</h3>
                <p style="color: #64748B; font-size: 13px; line-height: 1.4; margin: 0 0 8px 0;">{p.get('excerpt', '')[:150]}</p>
                <div style="font-size: 12px; color: #94A3B8;">By {p.get('author_name', 'Unknown')} from {p.get('author_city', '')} &middot; {p.get('likes', 0)} likes</div>
              </div>
            </a>"""

        tracking_pixel = f'<img src="{site_url}/api/track/open?d={digest_id}&e={email_hash}" width="1" height="1" style="display:none" />' if site_url else ''

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-weight: 900; font-size: 22px;">
              <span style="color: #EF4444;">B</span><span style="color: #F97316;">L</span><span style="color: #FACC15;">O</span><span style="color: #22C55E;">G</span><span style="color: #14B8A6;">S</span>
              <span style="color: #22C55E;">4</span>
              <span style="color: #EF4444;">B</span><span style="color: #3B82F6;">L</span><span style="color: #22C55E;">O</span><span style="color: #A855F7;">C</span><span style="color: #3B82F6;">K</span><span style="color: #14B8A6;">S</span>
            </span>
            <p style="color: #64748B; font-size: 13px; margin: 8px 0 0 0;">Weekly Digest</p>
          </div>
          <h2 style="color: #0F172A; font-size: 18px; margin-bottom: 6px;">This Week on Blogs 4 Blocks</h2>
          <p style="color: #64748B; font-size: 14px; margin-bottom: 16px;">{post_count} new posts &middot; {new_comments} new comments</p>
          <h3 style="color: #0F172A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Top Posts This Week</h3>
          {posts_html}
          <p style="color: #94A3B8; font-size: 11px; margin-top: 24px; text-align: center;">You're receiving this as a Blogs 4 Blocks community member.</p>
          {tracking_pixel}
        </div>
        """
        try:
            await send_email_notification(email, "Your Weekly Digest from Blogs 4 Blocks", html)
            sent_count += 1
        except Exception:
            errors += 1

    await db.digest_log.insert_one({
        "sent_at": now_iso,
        "recipients": sent_count,
        "errors": errors,
        "posts_included": len(top_posts),
        "status": "sent"
    })

    return {"message": f"Weekly digest sent to {sent_count} subscribers", "sent": sent_count, "errors": errors}

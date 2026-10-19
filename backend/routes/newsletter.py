import os
import hmac
import html as html_lib
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from database import db
from models import NewsletterSubscribe
from email_service import send_email_notification
from rate_limit import public_limiter
 
router = APIRouter()
 
 
def _new_unsubscribe_token() -> str:
    return secrets.token_urlsafe(32)
 
 
def _email_tracking_hash(email: str) -> str | None:
    key = os.environ.get("EMAIL_HASH_KEY")
    if not key:
        return None
    return hmac.digest(key.encode("utf-8"), email.encode("utf-8"), "sha256").hex()[:24]
 
 
async def _send_subscription_confirmation(email: str, token: str) -> None:
    site_url = (os.environ.get("SITE_URL") or "").rstrip("/")
    if not site_url:
        raise HTTPException(status_code=503, detail="Newsletter confirmation is not configured")
    confirmation_url = f"{site_url}/api/newsletter/confirm?token={token}"
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#0F172A;">Confirm your newsletter subscription</h2>
      <p style="color:#334155; line-height:1.6;">Please confirm that you want to receive the Blogs 4 Blocks weekly digest.</p>
      <p><a href="{confirmation_url}" style="background:#0A7A6A;color:white;padding:12px 18px;text-decoration:none;font-weight:700;">Confirm subscription</a></p>
      <p style="color:#64748B;font-size:12px;">This link expires in 48 hours. If you did not request this, you can ignore this email.</p>
    </div>
    """
    await send_email_notification(email, "Confirm your Blogs 4 Blocks newsletter subscription", html_content)
 
 
@router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe, request: Request):
    public_limiter.check(request, "newsletter-subscribe", maximum=5, window_seconds=3600)
    email = str(data.email).lower()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        if existing.get("active"):
            return {"message": "You're already subscribed!", "subscribed": True}
    now = datetime.now(timezone.utc)
    token = str(uuid.uuid4())
    await db.newsletter.update_one(
        {"email": email},
        {"$set": {"email": email, "name": data.name or "", "active": False, "pending_confirmation": True, "updated_at": now.isoformat()},
         "$setOnInsert": {"subscribed_at": now.isoformat(), "unsubscribe_token": _new_unsubscribe_token()}},
        upsert=True,
    )
    await db.newsletter_confirmations.update_one(
        {"email": email},
        {"$set": {"email": email, "token": token, "created_at": now.isoformat(), "expires_at": (now + timedelta(days=2)).isoformat()}},
        upsert=True,
    )
    await _send_subscription_confirmation(email, token)
    return {"message": "Check your email to confirm your subscription.", "subscribed": False, "confirmation_required": True}
 
 
@router.get("/newsletter/confirm")
async def confirm_newsletter_subscription(token: str):
    now_iso = datetime.now(timezone.utc).isoformat()
    confirmation = await db.newsletter_confirmations.find_one({"token": token, "expires_at": {"$gt": now_iso}}, {"_id": 0})
    if not confirmation:
        raise HTTPException(status_code=400, detail="Confirmation link is invalid or expired")
    await db.newsletter.update_one(
        {"email": confirmation["email"]},
        {"$set": {"active": True, "pending_confirmation": False, "confirmed_at": now_iso, "updated_at": now_iso}},
    )
    await db.newsletter_confirmations.delete_one({"token": token})
    site_url = (os.environ.get("SITE_URL") or "").rstrip("/")
    return RedirectResponse(url=f"{site_url}/?newsletter=confirmed" if site_url else "/")
 
 
def _unsubscribe_page(title: str, body: str) -> HTMLResponse:
    return HTMLResponse(f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#0F172A;">
<h2>{title}</h2>{body}</body></html>""")
 
 
@router.get("/newsletter/unsubscribe")
async def newsletter_unsubscribe_page(token: str = ""):
    # GET only shows a confirm button. Email security scanners open links
    # automatically, so a GET must never unsubscribe anyone by itself.
    if not token or len(token) > 100:
        return _unsubscribe_page("Invalid link", "<p>This unsubscribe link is invalid.</p>")
    safe_token = html_lib.escape(token, quote=True)
    return _unsubscribe_page(
        "Unsubscribe from Blogs 4 Blocks",
        f"""<p>Click below to stop receiving the weekly digest.</p>
<form method="post" action="/api/newsletter/unsubscribe?token={safe_token}">
<button type="submit" style="background:#0A7A6A;color:#fff;border:0;padding:12px 18px;font-weight:700;cursor:pointer;">Unsubscribe</button>
</form>""",
    )
 
 
@router.post("/newsletter/unsubscribe")
async def newsletter_unsubscribe(request: Request, token: str = ""):
    # Handles the confirm button above and Gmail/Yahoo one-click unsubscribe (RFC 8058).
    public_limiter.check(request, "newsletter-unsubscribe", maximum=20, window_seconds=3600)
    if not token or len(token) > 100:
        raise HTTPException(status_code=400, detail="Unsubscribe link is invalid")
    result = await db.newsletter.update_one(
        {"unsubscribe_token": token},
        {"$set": {"active": False, "pending_confirmation": False,
                  "unsubscribed_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        return _unsubscribe_page("Invalid link", "<p>This unsubscribe link is invalid or has expired.</p>")
    return _unsubscribe_page("You're unsubscribed", "<p>You won't receive the Blogs 4 Blocks weekly digest anymore.</p>")
 
 
async def _send_weekly_digest(selected_post_ids=None, intro_note=None):
    """Generate and send weekly digest to all active subscribers"""
    one_week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()
    digest_id = now_iso[:10]
    site_url = os.environ.get('SITE_URL', '')
 
    active_filter = {"$or": [{"expires_at": None}, {"expires_at": {"$exists": False}}, {"expires_at": {"$gt": now_iso}}]}
    if selected_post_ids:
        top_posts = await db.posts.find(
            {"id": {"$in": selected_post_ids}, **active_filter},
            {"_id": 0}
        ).to_list(10)
        order = {post_id: index for index, post_id in enumerate(selected_post_ids)}
        top_posts.sort(key=lambda p: order.get(p["id"], 999))
    else:
        top_posts = await db.posts.find(
            {"created_at": {"$gte": one_week_ago}, **active_filter},
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
 
    # Only confirmed subscribers get the digest - never every registered user.
    subscribers = await db.newsletter.find({"active": True}, {"_id": 0, "email": 1, "unsubscribe_token": 1}).to_list(5000)
    subscriber_tokens = {}
    for s in subscribers:
        token = s.get("unsubscribe_token")
        if not token:
            # Backfill subscribers who signed up before unsubscribe tokens existed.
            token = _new_unsubscribe_token()
            await db.newsletter.update_one({"email": s["email"]}, {"$set": {"unsubscribe_token": token}})
        subscriber_tokens[s["email"]] = token
 
    mailing_address = html_lib.escape(os.environ.get("MAILING_ADDRESS", ""))
    site_base = site_url.rstrip("/")
 
    post_count = await db.posts.count_documents({"created_at": {"$gte": one_week_ago}})
    new_comments = await db.comments.count_documents({"created_at": {"$gte": one_week_ago}})
    safe_intro_note = ""
    if intro_note:
        safe_intro_note = html_lib.escape(intro_note).replace("\n", "<br />")
 
    sent_count = 0
    errors = 0
    for email, unsubscribe_token in subscriber_tokens.items():
        email_hash = _email_tracking_hash(email)
        unsubscribe_url = f"{site_base}/api/newsletter/unsubscribe?token={unsubscribe_token}" if site_base else ""
 
        posts_html = ""
        for p in top_posts:
            post_url = f"{site_url}/post/{p['id']}" if site_url else f"/post/{p['id']}"
            tracked_url = f"{site_url}/api/track/click?d={digest_id}&e={email_hash}&url={quote(post_url, safe='')}" if site_url and email_hash else post_url
            posts_html += f"""
            <a href="{tracked_url}" style="text-decoration: none; display: block;">
              <div style="background: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #3B82F6;">
              <h3 style="color: #0F172A; font-size: 15px; margin: 0 0 6px 0; font-weight: 700;">{html_lib.escape(p['title'])}</h3>
              <p style="color: #64748B; font-size: 13px; line-height: 1.4; margin: 0 0 8px 0;">{html_lib.escape(p.get('excerpt', '')[:150])}</p>
              <div style="font-size: 12px; color: #94A3B8;">By {html_lib.escape(p.get('author_name', 'Unknown'))} from {html_lib.escape(p.get('author_city', ''))} &middot; {p.get('likes', 0)} likes</div>
              </div>
            </a>"""
 
        tracking_pixel = f'<img src="{site_url}/api/track/open?d={digest_id}&e={email_hash}" width="1" height="1" style="display:none" />' if site_url and email_hash else ''
 
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
          {f'<div style="background:#F8FAFC;border-left:4px solid #0A7A6A;padding:14px 16px;margin:16px 0;color:#334155;font-size:14px;line-height:1.6;">{safe_intro_note}</div>' if safe_intro_note else ''}
          <h3 style="color: #0F172A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Top Posts This Week</h3>
          {posts_html}
          <p style="color: #94A3B8; font-size: 11px; margin-top: 24px; text-align: center;">
            You're receiving this because you subscribed to the Blogs 4 Blocks weekly digest.
            {f'<a href="{unsubscribe_url}" style="color: #94A3B8;">Unsubscribe</a>' if unsubscribe_url else ''}
            {f'<br />{mailing_address}' if mailing_address else ''}
          </p>
          {tracking_pixel}
        </div>
        """
        try:
            headers = {
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            } if unsubscribe_url else None
            await send_email_notification(email, "Your Weekly Digest from Blogs 4 Blocks", html, headers)
            sent_count += 1
        except Exception:
            errors += 1
 
    await db.digest_log.insert_one({
        "sent_at": now_iso,
        "recipients": sent_count,
        "errors": errors,
        "posts_included": len(top_posts),
        "selected_post_ids": [p["id"] for p in top_posts],
        "has_intro_note": bool(intro_note),
        "status": "sent"
    })
 
    return {"message": f"Weekly digest sent to {sent_count} subscribers", "sent": sent_count, "errors": errors}

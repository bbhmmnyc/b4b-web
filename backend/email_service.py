import os
import logging
import html
import asyncio
import resend
import urllib.request
import urllib.error
import json
from database import db

logger = logging.getLogger("server")

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')


def _send_email_notification_sync(to_email: str, subject: str, html_content: str):
    """Send an email notification using Brevo when configured, otherwise Resend."""
    if BREVO_API_KEY:
        payload = {
            "sender": {"name": "Blogs 4 Blocks", "email": SENDER_EMAIL},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content,
        }
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response.read()
            logger.info(f"Brevo email sent to {to_email}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send Brevo email to {to_email}: {e}")
        return

    if not RESEND_API_KEY:
        logger.warning("BREVO_API_KEY/RESEND_API_KEY not set, skipping email")
        return
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": f"Blogs 4 Blocks <{SENDER_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        })
        logger.info(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_email_notification(to_email: str, subject: str, html_content: str):
    """Run synchronous provider SDKs outside FastAPI's event loop."""
    await asyncio.to_thread(_send_email_notification_sync, to_email, subject, html_content)


async def notify_post_author_of_comment(post, comment_doc):
    """Notify the post author when someone comments"""
    if not post.get("author_id"):
        return
    author = await db.users.find_one({"id": post["author_id"]}, {"_id": 0, "email": 1, "name": 1})
    if not author:
        return
    # Don't notify if author commented on their own post
    if comment_doc.get("author_name") == author.get("name"):
        return
    safe_author = html.escape(comment_doc.get("author_name", ""))
    safe_title = html.escape(post.get("title", ""))
    safe_content = html.escape(comment_doc.get("content", "")[:300]).replace("\n", "<br />")
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-weight: 900; font-size: 22px;">
          <span style="color: #EF4444;">B</span><span style="color: #F97316;">L</span><span style="color: #FACC15;">O</span><span style="color: #22C55E;">G</span><span style="color: #14B8A6;">S</span>
          <span style="color: #22C55E;">4</span>
          <span style="color: #EF4444;">B</span><span style="color: #3B82F6;">L</span><span style="color: #22C55E;">O</span><span style="color: #A855F7;">C</span><span style="color: #3B82F6;">K</span><span style="color: #14B8A6;">S</span>
        </span>
      </div>
      <h2 style="color: #0F172A; font-size: 18px;">New Comment on Your Post</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        <strong>{safe_author}</strong> commented on <strong>"{safe_title}"</strong>:
      </p>
      <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">{safe_content}</p>
      </div>
      <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">You're receiving this because someone commented on your post.</p>
    </div>
    """
    await send_email_notification(author["email"], f"New comment on \"{safe_title}\"", html_content)


async def notify_new_post_to_all_users(post_doc):
    """Notify all registered users about a new post"""
    all_users = await db.users.find({}, {"_id": 0, "email": 1, "id": 1}).to_list(1000)
    author_id = post_doc.get("author_id")
    async def send_to_user(u):
        if u["id"] == author_id:
            return
        safe_title = html.escape(post_doc.get("title", ""))
        safe_excerpt = html.escape(post_doc.get("excerpt", "")[:200])
        safe_author = html.escape(post_doc.get("author_name", "Unknown"))
        safe_city = html.escape(post_doc.get("author_city", ""))
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-weight: 900; font-size: 22px;">
              <span style="color: #EF4444;">B</span><span style="color: #F97316;">L</span><span style="color: #FACC15;">O</span><span style="color: #22C55E;">G</span><span style="color: #14B8A6;">S</span>
              <span style="color: #22C55E;">4</span>
              <span style="color: #EF4444;">B</span><span style="color: #3B82F6;">L</span><span style="color: #22C55E;">O</span><span style="color: #A855F7;">C</span><span style="color: #3B82F6;">K</span><span style="color: #14B8A6;">S</span>
            </span>
          </div>
          <h2 style="color: #0F172A; font-size: 18px;">New Post Published</h2>
          <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; margin: 16px 0; border-left: 4px solid #3B82F6;">
            <h3 style="color: #0F172A; font-size: 16px; margin: 0 0 8px 0;">{safe_title}</h3>
            <p style="color: #64748B; font-size: 13px; line-height: 1.4; margin: 0 0 8px 0;">{safe_excerpt}</p>
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">By {safe_author} from {safe_city}</p>
          </div>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">You're receiving this as a Blogs 4 Blocks community member.</p>
        </div>
        """
        try:
            await send_email_notification(u["email"], f"New Post: {safe_title}", html_content)
        except Exception:
            pass

    # Keep concurrency bounded so a large audience cannot overwhelm the mail provider.
    for start in range(0, len(all_users), 20):
        await asyncio.gather(*(send_to_user(u) for u in all_users[start:start + 20]))

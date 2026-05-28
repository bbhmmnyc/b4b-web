import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import db, client
from websocket_manager import ws_manager
from seed_data import SEED_CATEGORIES, SEED_SUBCATEGORIES, SEED_POSTS

# Route modules
from routes.auth import router as auth_router
from routes.categories import router as categories_router
from routes.posts import router as posts_router
from routes.comments import router as comments_router
from routes.admin import router as admin_router
from routes.newsletter import router as newsletter_router, _send_weekly_digest
from routes.partners import router as partners_router
from routes.profile import router as profile_router
from routes.upload import router as upload_router
from routes.tracking import router as tracking_router
from routes.misc import router as misc_router
from routes.advertise import router as advertise_router
from routes.payments import router as payments_router

ROOT_DIR = Path(__file__).parent
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

app = FastAPI(title="Blogs 4 Blocks API")

cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", os.environ.get("SITE_URL", "")).split(",")
    if origin.strip()
]
if not cors_origins:
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ==================== MOUNT ROUTERS ====================
# All routers are prefixed with /api via the include
from fastapi import APIRouter
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(posts_router)
api_router.include_router(comments_router)
api_router.include_router(admin_router)
api_router.include_router(newsletter_router)
api_router.include_router(partners_router)
api_router.include_router(profile_router)
api_router.include_router(upload_router)
api_router.include_router(tracking_router)
api_router.include_router(misc_router)
api_router.include_router(advertise_router)
api_router.include_router(payments_router)

app.include_router(api_router, prefix="/api")

# Static file serving for uploads
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ==================== WEBSOCKET ====================

@app.websocket("/api/ws/comments/{post_id}")
async def websocket_comments(websocket: WebSocket, post_id: str):
    await ws_manager.connect(websocket, post_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, post_id)

# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.posts.create_index("category_slug")
    await db.posts.create_index("created_at")
    await db.posts.create_index("author_id")
    await db.comments.create_index("post_id")
    await db.users.create_index("email", unique=True)
    await db.user_likes.create_index([("user_id", 1), ("post_id", 1)], unique=True)
    await db.user_prefs.create_index("user_id", unique=True)
    await db.categories.create_index("slug", unique=True)
    await db.subcategories.create_index("slug", unique=True)
    await db.newsletter.create_index("email", unique=True)
    await db.digest_log.create_index("sent_at")
    await db.partnerships.create_index([("requester_id", 1), ("target_id", 1)], unique=True)
    await db.partnerships.create_index("status")
    await db.email_events.create_index("digest_id")
    await db.email_events.create_index("event_type")

    # Seed categories
    for cat in SEED_CATEGORIES:
        await db.categories.update_one({"slug": cat["slug"]}, {"$setOnInsert": cat}, upsert=True)
    logger.info(f"Ensured {len(SEED_CATEGORIES)} categories in database")

    # Seed subcategories
    for sub in SEED_SUBCATEGORIES:
        await db.subcategories.update_one({"slug": sub["slug"]}, {"$setOnInsert": sub}, upsert=True)
    logger.info(f"Ensured {len(SEED_SUBCATEGORIES)} subcategories in database")

    # Auto-seed posts on startup
    existing = await db.posts.count_documents({})
    if existing == 0:
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
        logger.info(f"Auto-seeded {len(SEED_POSTS)} blog posts")

    # Start the weekly digest scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        _send_weekly_digest,
        'cron',
        day_of_week='mon',
        hour=9,
        minute=0,
        timezone='UTC',
        id='weekly_digest',
        replace_existing=True,
        misfire_grace_time=3600
    )
    scheduler.start()
    logger.info("Weekly digest scheduler started — runs every Monday at 9:00 AM UTC")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

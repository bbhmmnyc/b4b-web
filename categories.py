import uuid
import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from database import db
from auth import get_current_user, require_admin
from models import CategorySuggest
from seed_data import CATEGORY_COLORS

router = APIRouter()


@router.get("/categories")
async def get_categories():
    cats = await db.categories.find({"status": "approved"}, {"_id": 0}).to_list(100)
    return cats


@router.get("/categories/{slug}")
async def get_category(slug: str, page: int = 1, limit: int = 12):
    page = max(1, page)
    limit = max(1, min(limit, 50))

    cat = await db.categories.find_one({"slug": slug}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    skip = (page - 1) * limit
    now_iso = datetime.now(timezone.utc).isoformat()

    query = {
        "category_slug": slug,
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$exists": False}},
            {"expires_at": {"$gt": now_iso}}
        ]
    }

    total = await db.posts.count_documents(query)

    posts = await db.posts.find(query, {"_id": 0}) \
        .sort("created_at", -1) \
        .skip(skip) \
        .limit(limit) \
        .to_list(limit)

    subcategories = await db.subcategories.find(
        {"parent": slug},
        {"_id": 0}
    ).to_list(100)

    pages = max(1, (total + limit - 1) // limit)

    return {
        **cat,
        "subcategories": subcategories,
        "posts": posts,
        "total": total,
        "page": page,
        "pages": pages,
        "total_pages": pages,
        "per_page": limit,
    }

@router.get("/subcategories")
async def get_subcategories():
    subs = await db.subcategories.find({}, {"_id": 0}).to_list(100)
    return subs


@router.post("/categories/suggest")
async def suggest_category(suggestion: CategorySuggest, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Must be logged in to suggest categories")
    slug = re.sub(r'[^a-z0-9]+', '-', suggestion.name.lower()).strip('-')
    existing = await db.categories.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="This category already exists")
    import random
    cat_doc = {
        "slug": slug,
        "name": suggestion.name,
        "description": suggestion.description or f"Community-suggested category: {suggestion.name}",
        "color": suggestion.color or random.choice(CATEGORY_COLORS),
        "icon": "tag",
        "status": "pending",
        "suggested_by": user["id"],
        "suggested_by_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(cat_doc)
    return {"message": f"'{suggestion.name}' submitted for review!", "category": {k: v for k, v in cat_doc.items() if k != "_id"}}


@router.get("/categories/pending/list")
async def get_pending_categories(user=Depends(require_admin)):
    pending = await db.categories.find({"status": "pending"}, {"_id": 0}).to_list(100)
    return pending


@router.put("/categories/{slug}/approve")
async def approve_category(slug: str, user=Depends(require_admin)):
    result = await db.categories.update_one({"slug": slug, "status": "pending"}, {"$set": {"status": "approved"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found or already approved")
    cat = await db.categories.find_one({"slug": slug}, {"_id": 0})
    return {"message": f"Category '{cat['name']}' approved!", "category": cat}


@router.delete("/categories/{slug}/reject")
async def reject_category(slug: str, user=Depends(require_admin)):
    result = await db.categories.delete_one({"slug": slug, "status": "pending"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found or not pending")
    return {"message": "Category rejected and removed"}

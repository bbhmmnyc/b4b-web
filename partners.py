import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from database import db
from auth import require_user
from models import PartnerRequest

router = APIRouter()


@router.get("/partners/search")
async def search_partner_candidates(q: str, user=Depends(require_user)):
    if len(q) < 2:
        return []
    import re
    safe_q = re.escape(q.strip()[:80])
    users = await db.users.find(
        {"name": {"$regex": safe_q, "$options": "i"}, "id": {"$ne": user["id"]}},
        {"_id": 0, "id": 1, "name": 1, "city": 1, "country": 1}
    ).limit(10).to_list(10)
    return users


@router.post("/partners/request")
async def send_partner_request(req: PartnerRequest, user=Depends(require_user)):
    if req.target_id == user["id"]:
        raise HTTPException(status_code=400, detail="You can't partner with yourself")
    target = await db.users.find_one({"id": req.target_id}, {"_id": 0, "id": 1, "name": 1})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = await db.partnerships.find_one({
        "$or": [
            {"requester_id": user["id"], "target_id": req.target_id},
            {"requester_id": req.target_id, "target_id": user["id"]}
        ]
    })
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail=f"You're already partners with {target['name']}")
        raise HTTPException(status_code=400, detail="A partner request already exists")
    doc = {
        "id": str(uuid.uuid4()),
        "requester_id": user["id"],
        "requester_name": user["name"],
        "target_id": req.target_id,
        "target_name": target["name"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.partnerships.insert_one(doc)
    return {"message": f"Partner request sent to {target['name']}", "partnership_id": doc["id"]}


@router.get("/partners")
async def get_partners(user=Depends(require_user)):
    partnerships = await db.partnerships.find(
        {"status": "accepted", "$or": [{"requester_id": user["id"]}, {"target_id": user["id"]}]},
        {"_id": 0}
    ).to_list(100)
    partners = []
    for p in partnerships:
        partner_id = p["target_id"] if p["requester_id"] == user["id"] else p["requester_id"]
        partner_user = await db.users.find_one({"id": partner_id}, {"_id": 0, "id": 1, "name": 1, "city": 1, "country": 1})
        if partner_user:
            partners.append({**partner_user, "partnership_id": p["id"], "since": p.get("accepted_at", p["created_at"])})
    return partners


@router.get("/partners/requests")
async def get_partner_requests(user=Depends(require_user)):
    incoming = await db.partnerships.find(
        {"target_id": user["id"], "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    outgoing = await db.partnerships.find(
        {"requester_id": user["id"], "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"incoming": incoming, "outgoing": outgoing}


@router.put("/partners/{partnership_id}/accept")
async def accept_partner(partnership_id: str, user=Depends(require_user)):
    partnership = await db.partnerships.find_one({"id": partnership_id, "target_id": user["id"], "status": "pending"})
    if not partnership:
        raise HTTPException(status_code=404, detail="Partner request not found")
    await db.partnerships.update_one(
        {"id": partnership_id},
        {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"You're now partners with {partnership['requester_name']}!"}


@router.delete("/partners/{partnership_id}")
async def remove_partner(partnership_id: str, user=Depends(require_user)):
    partnership = await db.partnerships.find_one({
        "id": partnership_id,
        "$or": [{"requester_id": user["id"]}, {"target_id": user["id"]}]
    })
    if not partnership:
        raise HTTPException(status_code=404, detail="Partnership not found")
    await db.partnerships.delete_one({"id": partnership_id})
    return {"message": "Partnership removed"}

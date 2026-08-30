import uuid
from io import BytesIO
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import aiofiles
from PIL import Image, UnidentifiedImageError
from auth import require_user

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), user=Depends(require_user)):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="File type not allowed")

    content = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    # Lightweight magic-byte validation prevents spoofed content types.
    signatures = {
        ".jpg": [b"\xff\xd8\xff"],
        ".png": [b"\x89PNG\r\n\x1a\n"],
        ".gif": [b"GIF87a", b"GIF89a"],
        ".webp": [b"RIFF"],
    }
    is_webp = ext == ".webp" and len(content) >= 12 and content[8:12] == b"WEBP"
    if not any(content.startswith(sig) for sig in signatures[ext]) or (ext == ".webp" and not is_webp):
        raise HTTPException(status_code=400, detail="Invalid image file")

    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid image file")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, "wb") as out:
        await out.write(content)

    return {"url": f"/api/uploads/{filename}", "filename": filename}

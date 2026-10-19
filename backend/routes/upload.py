import asyncio
import uuid
from io import BytesIO
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import aiofiles
from PIL import Image, ImageOps, UnidentifiedImageError
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
MAX_IMAGE_PIXELS = 40_000_000  # ~40 megapixels; blocks decompression bombs
SAVE_FORMATS = {".jpg": "JPEG", ".png": "PNG", ".gif": "GIF", ".webp": "WEBP"}
 
 
def _reencode_image(content: bytes, ext: str) -> bytes:
    """Re-save the image with Pillow. This strips EXIF/GPS metadata and destroys
    anything that isn't image data (e.g. an HTML/script payload hidden in the file)."""
    with Image.open(BytesIO(content)) as image:
        image.verify()
    with Image.open(BytesIO(content)) as image:
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise ValueError("Image dimensions too large")
        animated = getattr(image, "is_animated", False)
        buffer = BytesIO()
        if animated:
            # Keep every frame for animated GIF/WebP.
            image.save(buffer, format=SAVE_FORMATS[ext], save_all=True)
        else:
            # Apply the camera's rotation before EXIF is dropped, or phone photos display sideways.
            image = ImageOps.exif_transpose(image)
            if ext == ".jpg":
                if image.mode != "RGB":
                    image = image.convert("RGB")
                image.save(buffer, format="JPEG", quality=88, optimize=True)
            elif ext == ".webp":
                image.save(buffer, format="WEBP", quality=88)
            else:
                image.save(buffer, format=SAVE_FORMATS[ext])
        return buffer.getvalue()
 
 
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
        content = await asyncio.to_thread(_reencode_image, content, ext)
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Invalid image file")
 
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, "wb") as out:
        await out.write(content)
 
    return {"url": f"/api/uploads/{filename}", "filename": filename}

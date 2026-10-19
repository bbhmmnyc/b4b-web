from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from urllib.parse import urlparse
 
 
def _validate_http_url(value: Optional[str]) -> Optional[str]:
    if value is None or not value.strip():
        return None
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("must be a valid http(s) URL")
    return value
 
 
class UserCreate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    published_name: Optional[str] = Field(default=None, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    city: str = Field(..., min_length=2, max_length=80)
    country: str = Field(..., min_length=2, max_length=80)
 
    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value):
        # bcrypt only uses the first 72 bytes; reject longer passwords at sign-up.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long (max 72 bytes).")
        return value
 
class UserLogin(BaseModel):
    email: str
    password: str
 
class UserResponse(BaseModel):
    id: str
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    published_name: Optional[str] = None
    email: str
    city: str
    country: str
    is_admin: bool = False
    created_at: str
 
class GuestAuthor(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    city: str = Field(..., min_length=2, max_length=80)
    country: str = Field(..., min_length=2, max_length=80)
 
class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=140)
    content: str = Field(..., min_length=20, max_length=50000)
    excerpt: str = Field(..., min_length=10, max_length=300)
    category_slug: str = Field(..., min_length=2, max_length=80)
    subcategory: Optional[str] = Field(default=None, max_length=80)
    tags: List[str] = Field(default_factory=list, max_length=10)
    cover_image: Optional[str] = Field(default=None, max_length=500)
    language: Optional[str] = Field(default="en", max_length=12)
    guest_author: Optional[GuestAuthor] = None
    co_authors: List[str] = Field(default_factory=list, max_length=10)
 
    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, value):
        if value is None:
            return None
        if not value.startswith("/api/uploads/"):
            raise ValueError("cover_image must reference an uploaded image")
        return value
 
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    author_name: Optional[str] = Field(default=None, max_length=80)
    author_city: Optional[str] = Field(default=None, max_length=80)
    author_country: Optional[str] = Field(default=None, max_length=80)
 
class ProfileColors(BaseModel):
    my_posts_color: str = "#3B82F6"
    interacted_color: str = "#22C55E"
 
class CategorySuggest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    color: Optional[str] = Field(default="#6366F1", max_length=20)
    description: Optional[str] = Field(default=None, max_length=300)
 
class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category_slug: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    language: Optional[str] = None
    co_authors: Optional[List[str]] = None
 
    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, value):
        if value is None:
            return None
        if not value.startswith("/api/uploads/"):
            raise ValueError("cover_image must reference an uploaded image")
        return value
 
class TranslationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=1000)
    excerpt: Optional[str] = Field(default=None, max_length=2000)
    content: str = Field(..., min_length=1, max_length=60000)
    target_language: str = Field(..., min_length=2, max_length=12)
    source_language: Optional[str] = Field(default="auto", max_length=12)
 
class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(default=None, max_length=120)
 
class DonationCheckoutRequest(BaseModel):
    amount: float = Field(..., ge=1, le=5000)
    donor_name: Optional[str] = Field(default=None, max_length=120)
    email: Optional[EmailStr] = None
    origin_url: str
 
class DigestSendRequest(BaseModel):
    post_ids: List[str] = Field(default_factory=list, max_length=10)
    intro_note: Optional[str] = Field(default=None, max_length=2000)
 
class PartnerRequest(BaseModel):
    target_id: str
 
class AdminSetupRequest(BaseModel):
    secret_key: str
 
class SponsorInfo(BaseModel):
    sponsor_name: str
    sponsor_url: Optional[str] = None
    sponsor_logo: Optional[str] = None
 
    @field_validator("sponsor_url", "sponsor_logo")
    @classmethod
    def validate_urls(cls, value):
        return _validate_http_url(value)
 
class SponsorUpdate(BaseModel):
    remove: bool = False
    sponsor_name: Optional[str] = Field(default=None, max_length=120)
    sponsor_url: Optional[str] = Field(default=None, max_length=500)
    sponsor_logo: Optional[str] = Field(default=None, max_length=500)
 
    @field_validator("sponsor_url", "sponsor_logo")
    @classmethod
    def validate_urls(cls, value):
        return _validate_http_url(value)
 
class AdBookingRequest(BaseModel):
    ad_size: str = Field(..., max_length=20)
    frequency: str = Field(..., max_length=20)
    placement: str = Field(..., max_length=40)
    advertiser: str = Field(..., min_length=2, max_length=120)
    contact_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    campaign_name: Optional[str] = Field(default=None, max_length=120)
    origin_url: str = Field(..., max_length=300)
 
class AdInquiry(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=120)
    contact_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    website: Optional[str] = Field(default=None, max_length=300)
    budget_range: Optional[str] = Field(default=None, max_length=80)
    message: str = Field(..., min_length=10, max_length=5000)
    preferred_categories: List[str] = Field(default_factory=list, max_length=20)

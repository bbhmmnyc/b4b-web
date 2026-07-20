from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class UserCreate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    published_name: Optional[str] = Field(default=None, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    city: str = Field(..., min_length=2, max_length=80)
    country: str = Field(..., min_length=2, max_length=80)

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
    name: str
    city: str
    country: str

class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=140)
    content: str = Field(..., min_length=20, max_length=50000)
    excerpt: str = Field(..., min_length=10, max_length=300)
    category_slug: str = Field(..., min_length=2, max_length=80)
    subcategory: Optional[str] = Field(default=None, max_length=80)
    tags: List[str] = Field(default_factory=list, max_length=10)
    cover_image: Optional[str] = Field(default=None, max_length=500)
    guest_author: Optional[GuestAuthor] = None
    co_authors: List[str] = Field(default_factory=list, max_length=10)

class CommentCreate(BaseModel):
    content: str
    author_name: Optional[str] = None
    author_city: Optional[str] = None
    author_country: Optional[str] = None

class ProfileColors(BaseModel):
    my_posts_color: str = "#3B82F6"
    interacted_color: str = "#22C55E"

class CategorySuggest(BaseModel):
    name: str
    color: Optional[str] = "#6366F1"
    description: Optional[str] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category_slug: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    co_authors: Optional[List[str]] = None

class NewsletterSubscribe(BaseModel):
    email: str
    name: Optional[str] = None

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

class AdInquiry(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=120)
    contact_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    website: Optional[str] = Field(default=None, max_length=300)
    budget_range: Optional[str] = Field(default=None, max_length=80)
    message: str = Field(..., min_length=10, max_length=5000)
    preferred_categories: List[str] = Field(default_factory=list, max_length=20)

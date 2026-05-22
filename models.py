from pydantic import BaseModel
from typing import Optional, List


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    city: str
    country: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
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
    title: str
    content: str
    excerpt: str
    category_slug: str
    subcategory: Optional[str] = None
    tags: List[str] = []
    cover_image: Optional[str] = None
    guest_author: Optional[GuestAuthor] = None
    co_authors: List[str] = []

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

class PartnerRequest(BaseModel):
    target_id: str

class AdminSetupRequest(BaseModel):
    secret_key: str

class SponsorInfo(BaseModel):
    sponsor_name: str
    sponsor_url: Optional[str] = None
    sponsor_logo: Optional[str] = None

class AdInquiry(BaseModel):
    company_name: str
    contact_name: str
    email: str
    website: Optional[str] = None
    budget_range: Optional[str] = None
    message: str
    preferred_categories: List[str] = []

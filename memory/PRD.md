# Blogs 4 Blocks — Product Requirements Document

## Original Problem Statement
Build a blogging website based in New York City called "Blogs 4 Blocks." Marketing professionals share blog posts about strategies that work for their demographic, creating an open forum. Inviting, easy to navigate, cheerful, exciting — yet elevated and refined enough to attract advertisers.

## Tech Stack
- **Backend:** FastAPI, MongoDB
- **Frontend:** React.js, Tailwind CSS, shadcn/ui, Framer Motion
- **Payments:** Stripe (emergentintegrations)
- **Real-time:** WebSockets
- **Email:** Resend API
- **Auth:** JWT
- **Scheduled Jobs:** APScheduler
- **Tracking:** Google Analytics 4 (G-TQ6RDMFSPJ)
- **Deployment Target:** Oracle Cloud Always Free (Ubuntu AMD)
- **PWA:** Yes

## All Completed Features
1. User registration & JWT auth
2. Guest posting (30-day expiry)
3. Dynamic blog categories + admin moderation
4. Rich text editor (TipTap)
5. Real-time comments (WebSockets)
6. Image uploads
7. PWA support
8. Admin panel (10 tabs: Overview, Campaigns, Featured & Sponsored, Inquiries, Moderation, Newsletter, Analytics, Posts, Comments, Users)
9. Like & share buttons
10. Partner/co-authoring
11. Newsletter & weekly digest (APScheduler + Resend)
12. Subscriber analytics (open/click tracking)
13. Email notifications
14. User profile dashboard
15. @username mentions in comments
16. Oracle Cloud Deployment Guide (Ubuntu AMD)
17. Featured Posts Carousel
18. Sponsored Posts System
19. Advertise Page with Stripe Checkout (rate card pricing)
20. Payment Success Page (polling)
21. City Background System (30 world landmarks)
22. **Ad Campaign Analytics Dashboard** — Revenue, inquiry pipeline, featured post performance, transaction history, GA4 link

## Rate Card
| Ad Size | 1 Run | 4 Runs | 8 Runs |
|---------|-------|--------|--------|
| Small   | $100  | $360   | $640   |
| Medium  | $175  | $630   | $1,120 |
| Large   | $300  | $1,080 | $1,920 |
Placement: Standard (1x), Premium (1.25x), Top Tier (1.5x)

## Test Reports
- iteration_12: 25/25 passed
- iteration_13: 22/23 passed
- iteration_14: 18/18 passed
- iteration_15: 22/22 passed
- iteration_16: 15/15 backend + all frontend passed

## Pre-Launch Checklist
- [ ] Swap Stripe test key for live key
- [ ] Set CORS_ORIGINS to real domain
- [ ] Configure Resend with verified domain sender
- [ ] Clean seed/test data
- [ ] Set up admin account on production

## Backlog
- Advertiser self-service campaign portal
- User-swappable city background photos

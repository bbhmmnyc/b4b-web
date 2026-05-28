# Code Review & Optimization Summary

## Key fixes applied
- Removed hard-coded production JWT/admin setup secrets and require environment configuration.
- Restricted CORS origins through `CORS_ORIGINS` / `SITE_URL` instead of wildcard credentials.
- Fixed `/api/posts` filtering so search no longer bypasses the non-expired post filter.
- Added pagination bounds to reduce accidental heavy queries.
- Escaped regex search inputs to reduce regex abuse / ReDoS risk.
- Added DOMPurify sanitization before rendering rich blog HTML.
- Restricted rich-text editor links to `http`, `https`, and `mailto`.
- Hardened image upload validation with size limits, server-chosen extensions, magic-byte checks, and async writes.
- Validated payment return origins and added `PAYMENT_ALLOWED_ORIGINS` support.
- Blocked unsafe tracking redirects.
- Resolved duplicate `/users/search` route conflict by moving partner search to `/partners/search`.
- Made frontend token storage safer around unavailable `localStorage`.
- Reduced production console logging from the service worker registration.

## Environment variables to set
- `JWT_SECRET`: required outside development/test.
- `ADMIN_SETUP_KEY`: required for `/admin/self-promote`.
- `CORS_ORIGINS`: comma-separated allowed frontend origins. Falls back to `SITE_URL`.
- `PAYMENT_ALLOWED_ORIGINS`: optional comma-separated checkout return origins. Falls back to `SITE_URL`.

## Notes
Frontend dependencies were updated to include `dompurify`; run your normal package install before building.

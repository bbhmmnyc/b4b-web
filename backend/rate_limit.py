"""Small in-process limiter for abuse-sensitive endpoints.

Deployments with multiple API instances should replace this with a shared
Redis-backed limiter; this still protects a single-process deployment.
"""
from collections import defaultdict, deque
from time import monotonic
from fastapi import HTTPException, Request


class SlidingWindowLimiter:
    def __init__(self):
        self._events = defaultdict(deque)

    def check(self, request: Request, scope: str, maximum: int, window_seconds: int) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{scope}:{client}"
        now = monotonic()
        events = self._events[key]
        while events and events[0] <= now - window_seconds:
            events.popleft()
        if len(events) >= maximum:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        events.append(now)


auth_limiter = SlidingWindowLimiter()

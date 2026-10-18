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
        self._last_sweep = monotonic()
 
    def _sweep(self, now: float) -> None:
        # Drop keys with no recent activity so memory does not grow forever.
        if now - self._last_sweep < 300:
            return
        self._last_sweep = now
        stale = [key for key, events in self._events.items() if not events or events[-1] <= now - 3600]
        for key in stale:
            del self._events[key]
 
    def check(self, request: Request, scope: str, maximum: int, window_seconds: int) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{scope}:{client}"
        now = monotonic()
        self._sweep(now)
        events = self._events[key]
        while events and events[0] <= now - window_seconds:
            events.popleft()
        if len(events) >= maximum:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        events.append(now)
 
 
auth_limiter = SlidingWindowLimiter()
public_limiter = SlidingWindowLimiter()

"""
Unified Redis + in-memory fallback cache service.

Priority:
  1. Redis (via REDIS_URL env var) — used in production (Render)
  2. In-memory dict — silent fallback for local dev / when Redis is unavailable

Usage:
    from services.cache import cache_get, cache_set, cache_delete

    value = cache_get("my_key")             # returns None if miss
    cache_set("my_key", data, ttl=300)      # 5 min TTL
    cache_delete("my_key")
"""

import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ── Try to connect to Redis ────────────────────────────────────────────────────
_redis_client = None

try:
    import redis as redis_lib
    _redis_url = os.getenv("REDIS_URL")
    if _redis_url:
        _redis_client = redis_lib.from_url(
            _redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        # Ping to verify connection at startup
        _redis_client.ping()
        logger.info("✅ Redis connected: %s", _redis_url[:30])
    else:
        logger.info("ℹ️  REDIS_URL not set — using in-memory cache")
except Exception as exc:
    logger.warning("⚠️  Redis unavailable (%s) — falling back to in-memory cache", exc)
    _redis_client = None

# ── In-memory fallback ─────────────────────────────────────────────────────────
_mem_cache: dict = {}   # key → {"value": ..., "expiry": datetime}


# ── Public API ─────────────────────────────────────────────────────────────────

def cache_get(key: str) -> Optional[Any]:
    """Return the cached value for *key*, or None on miss / expiry."""
    if _redis_client:
        try:
            raw = _redis_client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Redis GET error for %s: %s", key, exc)
            # Fall through to memory cache
    
    # In-memory fallback
    entry = _mem_cache.get(key)
    if entry is None:
        return None
    if entry["expiry"] < datetime.now(timezone.utc):
        del _mem_cache[key]
        return None
    return entry["value"]


def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """Store *value* under *key* with a TTL in seconds (default 5 min)."""
    if _redis_client:
        try:
            _redis_client.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception as exc:
            logger.warning("Redis SET error for %s: %s", key, exc)
            # Fall through to memory cache

    # In-memory fallback
    _mem_cache[key] = {
        "value": value,
        "expiry": datetime.now(timezone.utc) + timedelta(seconds=ttl),
    }


def cache_delete(key: str) -> None:
    """Remove a key from cache (useful after mutations)."""
    if _redis_client:
        try:
            _redis_client.delete(key)
            return
        except Exception as exc:
            logger.warning("Redis DEL error for %s: %s", key, exc)
    
    _mem_cache.pop(key, None)


def is_redis_available() -> bool:
    """Health check — True if Redis is connected."""
    return _redis_client is not None

import os
from functools import lru_cache

import redis


@lru_cache
def get_redis_client():
    """Return a Redis client if REDIS_URL is configured, else None."""
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    return redis.Redis.from_url(redis_url, decode_responses=True)

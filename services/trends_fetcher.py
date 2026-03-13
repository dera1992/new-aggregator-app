import threading
from datetime import datetime, timedelta

_lock = threading.Lock()
_cache: dict = {"topics": [], "fetched_at": None}
_CACHE_TTL = timedelta(minutes=30)
_REDIS_KEY = "trends:topics"
_REDIS_TTL = 3 * 60 * 60  # 3 hours — long-lived fallback

_FALLBACK_TOPICS = [
    "Breaking News", "World News", "Technology", "Sports", "Entertainment",
    "Politics", "Business", "Science", "Health", "Climate",
]


def _cache_valid() -> bool:
    fetched_at = _cache["fetched_at"]
    return fetched_at is not None and datetime.utcnow() - fetched_at < _CACHE_TTL


def _fetch_via_pytrends() -> list[str]:
    from pytrends.request import TrendReq
    pt = TrendReq(hl="en-US", tz=0, timeout=(10, 25), retries=2, backoff_factor=0.5)
    df = pt.trending_searches(pn="united_states")
    topics = [str(t) for t in df[0].dropna().tolist() if t]
    print(f"[trends] pytrends fetched {len(topics)} topics.")
    return topics


def _fetch_via_rss() -> list[str]:
    """Fallback: Google Trends official RSS feed (public, more stable)."""
    import feedparser
    feed = feedparser.parse("https://trends.google.com/trending/rss?geo=US")
    topics = [entry.title for entry in feed.entries if entry.get("title")]
    print(f"[trends] RSS fetched {len(topics)} topics.")
    return topics


def _load_from_redis() -> list[str]:
    try:
        from utils.redis_client import get_redis_client
        import json
        rc = get_redis_client()
        if rc:
            raw = rc.get(_REDIS_KEY)
            if raw:
                return json.loads(raw)
    except Exception:
        pass
    return []


def _save_to_redis(topics: list[str]) -> None:
    try:
        from utils.redis_client import get_redis_client
        import json
        rc = get_redis_client()
        if rc:
            rc.set(_REDIS_KEY, json.dumps(topics), ex=_REDIS_TTL)
    except Exception:
        pass


def get_trending_topics(geo: str = "US", count: int = 10) -> list[str]:
    """
    Returns trending search topics. Tries:
      1. In-memory cache (30 min TTL)
      2. pytrends (unofficial Google Trends API)
      3. Google Trends RSS feed (official, more rate-limit tolerant)
      4. Redis persisted cache (3-hour TTL, survives restarts)
      5. Hardcoded fallback topics
    """
    with _lock:
        if _cache_valid():
            return _cache["topics"][:count]

        topics: list[str] = []

        # Strategy 1: pytrends
        try:
            topics = _fetch_via_pytrends()
        except Exception as exc:
            print(f"[trends] pytrends failed: {exc}")

        # Strategy 2: Google Trends RSS
        if not topics:
            try:
                topics = _fetch_via_rss()
            except Exception as exc:
                print(f"[trends] RSS fallback failed: {exc}")

        if topics:
            _cache["topics"] = topics[:50]
            _cache["fetched_at"] = datetime.utcnow()
            _save_to_redis(topics[:50])
        else:
            # Strategy 3: Redis persisted cache
            redis_topics = _load_from_redis()
            if redis_topics:
                print("[trends] Using Redis persisted cache.")
                _cache["topics"] = redis_topics
                _cache["fetched_at"] = datetime.utcnow()
            else:
                # Strategy 4: hardcoded fallback
                print("[trends] All sources failed — using hardcoded fallback topics.")
                _cache["topics"] = _FALLBACK_TOPICS
                _cache["fetched_at"] = datetime.utcnow()

        return _cache["topics"][:count]

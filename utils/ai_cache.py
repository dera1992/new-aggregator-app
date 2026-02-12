import hashlib
import json
from datetime import datetime, timedelta
from typing import Any


def stable_hash_dict(d: dict[str, Any]) -> str:
    payload = json.dumps(d or {}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def stable_hash_text(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def now_utc() -> datetime:
    return datetime.utcnow()


def expires_in(hours: int) -> datetime:
    return now_utc() + timedelta(hours=hours)

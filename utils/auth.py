import hashlib
import secrets
from datetime import datetime, timedelta


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def token_expiry(hours: int = 2) -> datetime:
    return datetime.utcnow() + timedelta(hours=hours)

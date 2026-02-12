from __future__ import annotations

from typing import Any, Callable

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from models.models import AIOutputCache, db
from utils.ai_cache import expires_in, now_utc, stable_hash_dict, stable_hash_text


PROMPT_VERSIONS = {
    "comment": "v1",
    "joke": "v1",
    "viral_post": "v1",
    "analysis": "v1",
    "perspective": "v1",
}


class AIRouterError(Exception):
    pass


def select_model(task_type: str, quality: str = "standard") -> str:
    if quality == "premium":
        return "gpt-5.2"
    return "gpt-5-mini"


def run_task(
    task_type: str,
    *,
    user_id: int | None = None,
    article_id: int | None = None,
    cluster_id: int | None = None,
    input_text: str = "",
    params: dict[str, Any] | None = None,
    model: str | None = None,
    quality: str = "standard",
    prompt_version: str = "v1",
    ttl_hours: int = 24,
    force_refresh: bool = False,
    generator_fn: Callable[..., dict[str, Any]] | None = None,
) -> dict[str, Any]:
    if generator_fn is None:
        raise AIRouterError("generator_fn is required.")

    resolved_model = model or select_model(task_type, quality=quality)

    params_hash = stable_hash_dict(params or {})
    input_hash = stable_hash_text(input_text or "")
    now = now_utc()

    if not force_refresh:
        cached = (
            AIOutputCache.query.filter_by(
                task_type=task_type,
                model=resolved_model,
                prompt_version=prompt_version,
                params_hash=params_hash,
                input_hash=input_hash,
            )
            .filter(or_(AIOutputCache.expires_at.is_(None), AIOutputCache.expires_at > now))
            .order_by(AIOutputCache.id.desc())
            .first()
        )
        if cached:
            cached_output = dict(cached.output_json or {})
            cached_output["cache_hit"] = True
            return cached_output

    result = generator_fn(
        user_id=user_id,
        article_id=article_id,
        cluster_id=cluster_id,
        input_text=input_text,
        params=params or {},
        model=resolved_model,
    )

    payload = dict(result or {})
    payload.pop("cache_hit", None)

    cache_entry = AIOutputCache(
        user_id=user_id,
        article_id=article_id,
        cluster_id=cluster_id,
        task_type=task_type,
        model=resolved_model,
        prompt_version=prompt_version,
        params_hash=params_hash,
        input_hash=input_hash,
        output_json=payload,
        expires_at=expires_in(ttl_hours),
    )

    try:
        db.session.add(cache_entry)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

    output = dict(payload)
    output["cache_hit"] = False
    return output

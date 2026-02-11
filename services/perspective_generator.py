import json
import re
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI

from models.models import Article
from schemas.perspective import PerspectiveResponse
from services.ai_engine import client as ai_client


class PerspectiveError(Exception):
    pass


def _get_client() -> OpenAI:
    return ai_client or OpenAI()


def _strip_code_fences(payload: str) -> str:
    cleaned = payload.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def _safe_json_loads(payload: str) -> dict[str, Any]:
    cleaned = _strip_code_fences(payload)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise PerspectiveError("Model did not return valid JSON.")
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise PerspectiveError("Model did not return valid JSON.") from exc


def generate_perspective(cluster_id: int, tone: str, slang_level: str) -> dict[str, Any]:
    articles = (
        Article.query.filter(Article.cluster_id == cluster_id)
        .order_by(Article.created_at.desc())
        .all()
    )
    if not articles:
        raise PerspectiveError("Story not found.")

    latest = articles[0]
    source_lookup: dict[str, dict[str, str]] = {}
    for article in articles:
        source_key = article.source_url or f"{article.source_domain}:{article.id}"
        if source_key in source_lookup:
            continue
        source_lookup[source_key] = {
            "name": article.source_domain or "Unknown",
            "url": article.source_url,
        }
        if len(source_lookup) >= 8:
            break

    summary_candidates = [a.ai_summary for a in articles if a.ai_summary]
    summary_text = latest.ai_summary or "\n".join(summary_candidates[:3])
    if not summary_text:
        summary_text = latest.rss_summary or "No summary available."

    context = {
        "cluster_id": cluster_id,
        "story_title": latest.title,
        "category": latest.category or "Unknown",
        "summary": summary_text,
        "sources": list(source_lookup.values()),
        "tone": tone,
        "slang_level": slang_level,
    }

    system_prompt = (
        "You generate perspective analysis for grouped news stories. "
        "Return STRICT JSON only (no markdown) that matches this shape: "
        "cluster_id, neutral_facts[], what_we_know[], what_is_unclear[], angles[], "
        "sentiment, scores, sources[], generated_at. "
        "Neutral facts first. Separate facts from claims. Do not invent quotes. "
        "Angles must include: Supporters, Critics, Neutral context, Gen-Z take, Global view. "
        "sentiment.top_emotions has objects {emotion, score}. "
        "scores.bias.value must be between -1 and 1. "
        "scores.clickbait and scores.evidence must be between 0 and 1."
    )

    user_prompt = (
        "Generate a PerspectiveResponse JSON for this story context:\n"
        f"{json.dumps(context, ensure_ascii=False)}"
    )

    try:
        response = _get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.35,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise PerspectiveError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    data = _safe_json_loads(content)
    data["cluster_id"] = cluster_id
    data.setdefault("sources", list(source_lookup.values()))
    data["generated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        validated = PerspectiveResponse.model_validate(data)
    except Exception as exc:
        raise PerspectiveError(f"Perspective validation failed: {exc}") from exc

    return validated.model_dump()

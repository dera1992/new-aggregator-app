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


def _bias_label_from_value(value: float) -> str:
    if value <= -0.2:
        return "left"
    if value >= 0.2:
        return "right"
    return "neutral"


def _normalize_angles(raw_angles: Any) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    if isinstance(raw_angles, list):
        for angle in raw_angles:
            if isinstance(angle, dict):
                item = dict(angle)
                if not item.get("label"):
                    item["label"] = "Perspective"
                if not item.get("summary"):
                    key_points = item.get("key_points")
                    if isinstance(key_points, list) and key_points:
                        item["summary"] = " ".join(str(part) for part in key_points if part)
                    elif isinstance(item.get("text"), str):
                        item["summary"] = item["text"]
                    else:
                        item["summary"] = "No summary provided."
                normalized.append(item)
            elif isinstance(angle, str):
                normalized.append({"label": "Perspective", "summary": angle})
        return normalized

    if isinstance(raw_angles, dict):
        normalized: list[dict[str, Any]] = []
        for label, content in raw_angles.items():
            if isinstance(content, dict):
                item = {"label": str(label), **content}
            elif isinstance(content, list):
                summary = " ".join(str(part) for part in content if part)
                item = {"label": str(label), "summary": summary, "key_points": content}
            else:
                item = {"label": str(label), "summary": str(content)}
            normalized.append(item)
        return normalized

    return normalized


def _normalize_sources(raw_sources: Any, fallback_sources: list[dict[str, Any]]) -> list[dict[str, str]]:
    cleaned_fallback: list[dict[str, str]] = []
    for source in fallback_sources:
        if not isinstance(source, dict):
            continue
        url = source.get("url")
        if not isinstance(url, str) or not url.strip():
            continue
        cleaned_fallback.append({"name": str(source.get("name") or "Unknown"), "url": url})

    if not isinstance(raw_sources, list):
        return cleaned_fallback

    normalized: list[dict[str, str]] = []
    for entry in raw_sources:
        if isinstance(entry, str):
            normalized.append({"name": "Unknown", "url": entry})
            continue
        if isinstance(entry, dict):
            url = entry.get("url")
            if not url:
                continue
            normalized.append({"name": entry.get("name") or "Unknown", "url": url})

    return normalized or cleaned_fallback


def _normalize_perspective_payload(data: dict[str, Any], *, fallback_sources: list[dict[str, Any]]) -> dict[str, Any]:
    normalized = dict(data)
    normalized["angles"] = _normalize_angles(normalized.get("angles"))

    scores = normalized.get("scores")
    if isinstance(scores, dict):
        bias = scores.get("bias")
        if isinstance(bias, dict):
            value = bias.get("value")
            parsed_value: float | None = None
            if isinstance(value, (int, float)):
                parsed_value = float(value)
            elif isinstance(value, str):
                try:
                    parsed_value = float(value)
                    bias["value"] = parsed_value
                except ValueError:
                    parsed_value = None
            if parsed_value is not None and not bias.get("label"):
                bias["label"] = _bias_label_from_value(parsed_value)

    normalized["sources"] = _normalize_sources(normalized.get("sources"), fallback_sources)
    return normalized




def _ensure_required_blocks(data: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(data)
    normalized.setdefault("neutral_facts", [])
    normalized.setdefault("what_we_know", [])
    normalized.setdefault("what_is_unclear", [])
    normalized.setdefault("angles", [])
    normalized.setdefault("sentiment", {
        "top_emotions": [],
        "top_questions": [],
        "shareable_claims": [],
    })
    normalized.setdefault("scores", {
        "bias": {"value": 0.0, "label": "neutral"},
        "clickbait": 0.0,
        "evidence": 0.0,
    })

    scores = normalized.get("scores")
    if isinstance(scores, dict):
        scores.setdefault("clickbait", 0.0)
        scores.setdefault("evidence", 0.0)
        bias = scores.get("bias")
        if not isinstance(bias, dict):
            scores["bias"] = {"value": 0.0, "label": "neutral"}
        else:
            bias.setdefault("value", 0.0)
            bias.setdefault("label", "neutral")

    return normalized


def generate_perspective_from_text(text: str, tone: str, slang_level: str) -> dict[str, Any]:
    context = {
        "text": text[:8000],
        "tone": tone,
        "slang_level": slang_level,
    }

    system_prompt = (
        "You generate perspective analysis for news text. "
        "Return STRICT JSON only (no markdown) that matches this shape: "
        "neutral_facts[], what_we_know[], what_is_unclear[], angles[], "
        "sentiment, scores, generated_at. "
        "Neutral facts first. Separate facts from claims. Do not invent quotes. "
        "Angles must include: Supporters, Critics, Neutral context, Gen-Z take, Global view. "
        "sentiment.top_emotions has objects {emotion, score}. "
        "scores.bias.value must be between -1 and 1. "
        "scores.clickbait and scores.evidence must be between 0 and 1."
    )

    user_prompt = (
        "Generate a perspective analysis JSON for this news text:\n"
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
    data = _normalize_perspective_payload(data, fallback_sources=[])
    data = _ensure_required_blocks(data)
    data["cluster_id"] = 0
    data["sources"] = []
    data["generated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        validated = PerspectiveResponse.model_validate(data)
    except Exception as exc:
        raise PerspectiveError(f"Perspective validation failed: {exc}") from exc

    return validated.model_dump()


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
        if not article.source_url:
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
    data = _normalize_perspective_payload(data, fallback_sources=list(source_lookup.values()))
    data = _ensure_required_blocks(data)
    data["cluster_id"] = cluster_id
    data.setdefault("sources", list(source_lookup.values()))
    data["generated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        validated = PerspectiveResponse.model_validate(data)
    except Exception as exc:
        raise PerspectiveError(f"Perspective validation failed: {exc}") from exc

    return validated.model_dump()

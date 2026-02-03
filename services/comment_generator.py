import json
from typing import Any, Dict

from openai import OpenAI

from services.ai_engine import client as ai_client
from services.comment_prompts import build_messages


class CommentGenError(Exception):
    pass


def _get_client() -> OpenAI:
    return ai_client or OpenAI()


def _validate_payload(data: Dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise CommentGenError("Model JSON must be an object.")
    if "variants" not in data:
        raise CommentGenError("Model JSON missing required fields.")
    variants = data.get("variants")
    if not isinstance(variants, list) or not variants:
        raise CommentGenError("Model JSON variants must be a non-empty list.")
    for variant in variants:
        if not isinstance(variant, dict) or "text" not in variant:
            raise CommentGenError("Each variant must include a text field.")


def generate_comment(
    *,
    summary: str,
    platform: str,
    style: str,
    audience: str,
    max_variants: int,
    fact_mode: str,
    model: str = "gpt-4o-mini",
) -> Dict[str, Any]:
    client = _get_client()
    messages = build_messages(
        summary=summary,
        platform=platform,
        style=style,
        audience=audience,
        max_variants=max_variants,
        fact_mode=fact_mode,
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise CommentGenError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise CommentGenError("Model did not return valid JSON.") from exc

    _validate_payload(data)
    return data

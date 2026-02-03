import json
import re
from typing import Any, Dict, Optional

from services.ai_engine import client
from services.joke_prompts import build_joke_messages


class JokeGenError(Exception):
    pass


def _extract_json_object(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _validate_payload(data: Dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise JokeGenError("Model JSON must be an object.")
    if "variants" not in data:
        raise JokeGenError("Model JSON missing required fields.")
    variants = data.get("variants")
    if not isinstance(variants, list) or not variants:
        raise JokeGenError("Model JSON variants must be a non-empty list.")
    for variant in variants:
        if not isinstance(variant, dict) or "text" not in variant:
            raise JokeGenError("Each variant must include a text field.")


def generate_joke(
    *,
    summary: str,
    platform: str,
    style: str,
    audience: Optional[str],
    max_variants: int,
    fact_mode: bool,
    model: Optional[str] = "gpt-4o-mini",
) -> Dict[str, Any]:
    if client is None:
        raise JokeGenError("OpenAI client not configured.")

    resolved_model = model or "gpt-4o-mini"
    messages = build_joke_messages(
        summary=summary,
        platform=platform,
        style=style,
        audience=audience,
        max_variants=max_variants,
        fact_mode=fact_mode,
    )

    try:
        response = client.chat.completions.create(
            model=resolved_model,
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise JokeGenError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    try:
        data = _extract_json_object(content)
    except json.JSONDecodeError as exc:
        raise JokeGenError("Model did not return valid JSON.") from exc

    _validate_payload(data)
    return data

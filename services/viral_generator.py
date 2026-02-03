import json
import re
from typing import Any, Dict

from services.ai_engine import client
from services.viral_prompts import build_messages


class ViralPostError(Exception):
    pass


def _extract_json_object(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def generate_viral_post(
    *,
    summary: str,
    platform: str,
    tone: str,
    goal: str,
    audience: str,
    brand_voice: str,
    max_variants: int,
    fact_mode: str,
    model: str = "gpt-4o-mini",
) -> Dict[str, Any]:
    if client is None:
        raise ViralPostError("OpenAI client not configured.")

    messages = build_messages(
        summary=summary,
        platform=platform,
        tone=tone,
        goal=goal,
        audience=audience,
        brand_voice=brand_voice,
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
        raise ViralPostError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    try:
        data = _extract_json_object(content)
    except json.JSONDecodeError as exc:
        raise ViralPostError("Model did not return valid JSON.") from exc

    if not isinstance(data, dict) or "variants" not in data:
        raise ViralPostError("Model JSON missing required fields.")

    return data

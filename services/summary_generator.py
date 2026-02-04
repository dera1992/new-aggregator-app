import json
import re
from typing import Any, Dict, List, Optional

from openai import OpenAI

from services.ai_engine import client as ai_client


class SummaryGenError(Exception):
    pass


def _get_client() -> OpenAI:
    return ai_client or OpenAI()


def _build_messages(
    *,
    text: str,
    style: str,
    max_length: Optional[int],
    fact_mode: bool,
) -> List[Dict[str, str]]:
    style_map = {
        "short": "2-3 tight sentences.",
        "standard": "4-6 sentences with the core facts.",
        "detailed": "1-2 short paragraphs with key context and implications.",
    }
    length_instruction = (
        f"Keep the summary under {max_length} words."
        if max_length
        else "Keep the summary concise."
    )
    fact_instruction = (
        "Do not add facts that are not present in the text."
        if fact_mode
        else "You may infer reasonable context but avoid speculation."
    )

    system_prompt = (
        "You are a professional news summarizer. "
        "Return a JSON object with keys summary (string) and warnings (array of strings). "
        "Return only JSON."
    )
    user_prompt = (
        f"Summarize the following article in {style_map.get(style, style_map['standard'])} "
        f"{length_instruction} {fact_instruction}\n\n"
        f"Article text:\n{text}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def generate_summary(
    *,
    text: str,
    style: str = "standard",
    max_length: Optional[int] = None,
    fact_mode: bool = True,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    client = _get_client()
    messages = _build_messages(
        text=text,
        style=style,
        max_length=max_length,
        fact_mode=fact_mode,
    )

    try:
        response = client.chat.completions.create(
            model=model or "gpt-4o-mini",
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise SummaryGenError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    data = _extract_json(content)
    if isinstance(data, dict) and isinstance(data.get("summary"), str):
        warnings = data.get("warnings", [])
        if not isinstance(warnings, list):
            warnings = []
        return {"summary": data["summary"].strip(), "warnings": warnings}

    summary_text = content.strip()
    if not summary_text:
        raise SummaryGenError("Model did not return a summary.")
    return {
        "summary": summary_text,
        "warnings": ["Model returned non-JSON output; used raw summary."],
    }

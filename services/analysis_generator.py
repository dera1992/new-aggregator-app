import json
import re
from typing import Any, Dict, Optional

from openai import OpenAI

from services.ai_engine import client as ai_client
from services.analysis_prompts import build_analysis_messages


class AnalysisGenError(Exception):
    pass


def _get_client() -> OpenAI:
    return ai_client or OpenAI()


def _safe_json_loads(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise AnalysisGenError("Model did not return valid JSON.")
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise AnalysisGenError("Model did not return valid JSON.") from exc


def _validate_payload(data: Dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise AnalysisGenError("Model JSON must be an object.")
    variants = data.get("variants")
    if not isinstance(variants, list) or not variants:
        raise AnalysisGenError("Model JSON variants must be a non-empty list.")
    warnings = data.get("warnings", [])
    if not isinstance(warnings, list):
        raise AnalysisGenError("Model JSON warnings must be a list.")
    best_index = data.get("best_variant_index", 0)
    if not isinstance(best_index, int):
        raise AnalysisGenError("best_variant_index must be an integer.")


def generate_analysis(
    *,
    summary: str,
    format: str,
    tone: str,
    audience: str,
    include_takeaways: bool,
    include_counterpoints: bool,
    include_what_to_watch: bool,
    fact_mode: bool,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    client = _get_client()
    messages = build_analysis_messages(
        summary=summary,
        format=format,
        tone=tone,
        audience=audience,
        include_takeaways=include_takeaways,
        include_counterpoints=include_counterpoints,
        include_what_to_watch=include_what_to_watch,
        fact_mode=fact_mode,
    )
    try:
        response = client.chat.completions.create(
            model=model or "gpt-4o-mini",
            messages=messages,
            temperature=0.75,
            top_p=0.95,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise AnalysisGenError(f"OpenAI request failed: {exc}") from exc

    content = response.choices[0].message.content or ""
    data = _safe_json_loads(content)
    if "warnings" not in data:
        data["warnings"] = []
    if "best_variant_index" not in data:
        data["best_variant_index"] = 0

    _validate_payload(data)
    return data

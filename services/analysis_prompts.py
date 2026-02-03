from typing import Dict, List

SYSTEM_RULES = (
    "You are a careful news analyst. "
    "Do not invent facts beyond the provided summary. "
    "If a detail is missing, acknowledge uncertainty or omit it. "
    "Keep content safe and non-harmful. "
    "Return only strict JSON with no extra text."
)

FORMAT_GUIDES: Dict[str, str] = {
    "brief": "Aim for ~120-180 words for the full analysis.",
    "standard": "Aim for ~200-320 words for the full analysis.",
    "deep": "Aim for ~350-500 words for the full analysis.",
}


def build_analysis_messages(
    *,
    summary: str,
    format: str,
    tone: str,
    audience: str,
    include_takeaways: bool,
    include_counterpoints: bool,
    include_what_to_watch: bool,
    fact_mode: bool,
) -> List[Dict[str, str]]:
    format_guide = FORMAT_GUIDES.get(format, FORMAT_GUIDES["standard"])
    system_prompt = (
        f"{SYSTEM_RULES} "
        "The JSON must match this exact shape: "
        "{"
        "\"best_variant_index\": 0, "
        "\"warnings\": [\"...\"], "
        "\"variants\": ["
        "{"
        "\"title\": \"...\", "
        "\"hook\": \"...\", "
        "\"analysis\": \"...\", "
        "\"key_takeaways\": [\"...\"], "
        "\"counterpoints\": [\"...\"], "
        "\"what_to_watch\": [\"...\"], "
        "\"reading_time_seconds\": 120"
        "}"
        "]"
        "}"
    )
    user_prompt = (
        f"Summary:\n{summary}\n\n"
        f"Format: {format}\n"
        f"Tone: {tone}\n"
        f"Audience: {audience}\n"
        f"Include takeaways: {include_takeaways}\n"
        f"Include counterpoints: {include_counterpoints}\n"
        f"Include what to watch: {include_what_to_watch}\n"
        f"Fact mode: {fact_mode}\n"
        f"Length guidance: {format_guide}\n\n"
        "Generate 3 variants with distinct angles (e.g., market impact, policy, "
        "technology, societal implications). Pick the best variant and set its index "
        "in best_variant_index. Include warnings if the summary lacks specifics, "
        "naming what is missing (e.g., numbers, timeline, stakeholders). "
        "If no warnings, return an empty warnings array. "
        "If a section is excluded, return an empty array for that section. "
        "Return only the JSON object."
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

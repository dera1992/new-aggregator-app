from typing import Dict, List, Optional


PLATFORM_RULES: Dict[str, str] = {
    "General": (
        "Keep the joke short and clear, ideally 1-2 sentences. "
        "Avoid hashtags unless explicitly requested."
    ),
    "Twitter": (
        "Keep it within 280 characters. "
        "Use 1-2 short sentences and at most 1 relevant hashtag if it helps."
    ),
    "LinkedIn": (
        "Write a professional, lighthearted joke in 1-2 sentences. "
        "Avoid slang, keep it workplace-appropriate, and no hashtags unless asked."
    ),
    "Instagram": (
        "Write a playful caption-style joke in 1-2 sentences. "
        "Use 1-3 relevant hashtags only if they fit naturally."
    ),
    "Reddit": (
        "Write a grounded, witty joke in 1-3 sentences. "
        "Avoid a promotional tone and skip hashtags."
    ),
}


def build_joke_messages(
    *,
    summary: str,
    platform: str,
    style: str,
    audience: Optional[str],
    max_variants: int,
    fact_mode: bool,
) -> List[Dict[str, str]]:
    platform_guidance = PLATFORM_RULES.get(platform, "")
    audience_line = audience or "General audience"
    system_prompt = (
        "You generate safe, lighthearted jokes based on news summaries. "
        "Use ONLY facts present in the provided summary. "
        "Do NOT invent names, numbers, claims, locations, or outcomes. "
        "If the summary lacks detail, omit it rather than guessing. "
        "Keep the humor non-hateful, non-violent, and non-explicit. "
        "Return ONLY strict JSON with no extra text. "
        "The JSON must match this schema: "
        "{"
        "\"best_variant_index\": number, "
        "\"warnings\": [string], "
        "\"jokes\": [{"
        "\"style\": string, "
        "\"setup\": string, "
        "\"punchline\": string, "
        "\"full_joke\": string, "
        "\"cta\": string"
        "}]"
        "}. "
        "Set best_variant_index to the strongest joke. "
        "If there are no warnings, return an empty array. "
        "The jokes array length must not exceed max_variants."
    )
    user_prompt = (
        f"Summary:\n{summary}\n\n"
        f"Platform: {platform}\n"
        f"Style: {style}\n"
        f"Audience: {audience_line}\n"
        f"Max variants: {max_variants}\n"
        f"Fact mode: {fact_mode}\n"
        f"Platform guidance: {platform_guidance}\n\n"
        "Return the JSON now."
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

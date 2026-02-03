from typing import Dict, List

PLATFORM_RULES: Dict[str, str] = {
    "General": (
        "Write a clear, thoughtful comment in 1-2 sentences. "
        "Avoid hashtags unless explicitly requested."
    ),
    "Twitter": (
        "Write a concise reply that fits within 280 characters. "
        "Use 1-2 short sentences and at most 1 hashtag if it adds clarity."
    ),
    "LinkedIn": (
        "Write a professional, insight-driven comment in 2-3 sentences. "
        "Offer a measured takeaway and avoid slang."
    ),
    "Facebook": (
        "Write a friendly, conversational comment in 1-2 sentences. "
        "Keep it approachable and avoid heavy jargon."
    ),
    "Reddit": (
        "Write a thoughtful, grounded comment in 2-4 sentences. "
        "Prioritize clarity, avoid marketing tone, and acknowledge uncertainty."
    ),
}


def build_messages(
    *,
    summary: str,
    platform: str,
    style: str,
    audience: str,
    max_variants: int,
    fact_mode: str,
) -> List[Dict[str, str]]:
    platform_guidance = PLATFORM_RULES.get(platform, "")
    system_prompt = (
        "You generate insightful standard comments for news summaries. "
        "Use ONLY facts present in the provided summary. "
        "Do NOT invent names, numbers, claims, locations, or outcomes. "
        "If the summary lacks detail, omit it rather than guessing. "
        "Return ONLY strict JSON with no extra text. "
        "The JSON must match this schema: "
        "{\"platform\": string, \"style\": string, \"audience\": string, "
        "\"variants\": [{\"text\": string}]}. "
        "The variants array length must not exceed max_variants."
    )
    user_prompt = (
        f"Summary:\n{summary}\n\n"
        f"Platform: {platform}\n"
        f"Style: {style}\n"
        f"Audience: {audience}\n"
        f"Max variants: {max_variants}\n"
        f"Fact mode: {fact_mode}\n"
        f"Platform guidance: {platform_guidance}\n\n"
        "Return the JSON now."
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

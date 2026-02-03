from typing import Dict, List


PLATFORM_TEMPLATES: Dict[str, str] = {
    "twitter": (
        "Write punchy, concise copy that fits within 280 characters. "
        "Use 1-2 short sentences and 1-3 relevant hashtags. "
        "Avoid emojis unless the brand voice explicitly calls for them."
    ),
    "linkedin": (
        "Write a professional, insight-driven post in 2-4 short paragraphs. "
        "Include a thoughtful takeaway and 1-2 relevant hashtags."
    ),
    "instagram": (
        "Write a visually evocative caption in 2-3 sentences with a hook, "
        "then 3-5 short bullet-style lines or emojis if the brand voice fits. "
        "Include 3-6 relevant hashtags."
    ),
}


def build_messages(
    *,
    summary: str,
    platform: str,
    tone: str,
    goal: str,
    audience: str,
    brand_voice: str,
    max_variants: int,
    fact_mode: str,
) -> List[Dict[str, str]]:
    platform_guidance = PLATFORM_TEMPLATES.get(platform, "")
    system_prompt = (
        "You are a social media copywriter. "
        "Only use facts present in the provided summary. "
        "Do not invent names, numbers, claims, or outcomes. "
        "If the summary lacks a detail, omit it rather than guessing. "
        "Return only strict JSON with no extra commentary. "
        "The JSON must match this schema: "
        "{\"platform\": string, \"variants\": [{\"text\": string}]}."
    )
    user_prompt = (
        f"Summary:\n{summary}\n\n"
        f"Platform: {platform}\n"
        f"Tone: {tone}\n"
        f"Goal: {goal}\n"
        f"Audience: {audience}\n"
        f"Brand voice: {brand_voice}\n"
        f"Max variants: {max_variants}\n"
        f"Fact mode: {fact_mode}\n"
        f"Platform guidance: {platform_guidance}\n\n"
        "Return the JSON now."
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

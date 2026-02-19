from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CommentRequest(BaseModel):
    summary: str = Field(..., min_length=1)
    platform: Literal["General", "Twitter", "LinkedIn", "Facebook", "Reddit"]
    style: Literal["curious", "supportive", "critical", "neutral"]
    audience: str = Field(..., min_length=1)
    max_variants: int = Field(1, ge=1, le=5)
    fact_mode: str = Field("strict", min_length=1)
    force_refresh: bool = False

    @field_validator("platform", mode="before")
    @classmethod
    def normalize_platform(cls, value: object) -> str:
        if not isinstance(value, str):
            return "General"
        lookup = {
            "general": "General",
            "twitter": "Twitter",
            "linkedin": "LinkedIn",
            "facebook": "Facebook",
            "reddit": "Reddit",
        }
        return lookup.get(value.strip().lower(), value)

    @field_validator("fact_mode", mode="before")
    @classmethod
    def normalize_fact_mode(cls, value: object) -> str:
        if isinstance(value, bool):
            return "strict" if value else "balanced"
        if isinstance(value, str):
            cleaned = value.strip().lower()
            return cleaned or "strict"
        return "strict"

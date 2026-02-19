from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class JokeRequest(BaseModel):
    summary: str = Field(..., min_length=1)
    platform: Literal["General", "Twitter", "LinkedIn", "Instagram", "Reddit"] = "General"
    style: Literal[
        "pun",
        "one_liner",
        "observational",
        "satire_light",
        "dad_joke",
    ] = "one_liner"
    audience: Optional[str] = None
    max_variants: int = Field(3, ge=1, le=5)
    fact_mode: bool = True
    model: Optional[str] = None
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
            "instagram": "Instagram",
            "reddit": "Reddit",
        }
        return lookup.get(value.strip().lower(), value)

    @field_validator("fact_mode", mode="before")
    @classmethod
    def normalize_fact_mode(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            cleaned = value.strip().lower()
            if cleaned in {"true", "1", "yes", "on", "strict"}:
                return True
            if cleaned in {"false", "0", "no", "off", "balanced"}:
                return False
        return True

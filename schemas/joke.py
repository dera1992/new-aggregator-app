from typing import Literal, Optional

from pydantic import BaseModel, Field


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

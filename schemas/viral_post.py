from typing import Literal
from pydantic import BaseModel, Field


class ViralPostRequest(BaseModel):
    summary: str = Field(..., min_length=1)
    platform: Literal["twitter", "linkedin", "instagram"]
    tone: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    audience: str = Field(..., min_length=1)
    brand_voice: str = Field(..., min_length=1)
    max_variants: int = Field(1, ge=1, le=5)
    fact_mode: str = Field("strict", min_length=1)

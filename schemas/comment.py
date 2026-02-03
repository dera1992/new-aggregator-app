from typing import Literal

from pydantic import BaseModel, Field


class CommentRequest(BaseModel):
    summary: str = Field(..., min_length=1)
    platform: Literal["General", "Twitter", "LinkedIn", "Facebook", "Reddit"]
    style: Literal["curious", "supportive", "critical", "neutral"]
    audience: str = Field(..., min_length=1)
    max_variants: int = Field(1, ge=1, le=5)
    fact_mode: str = Field("strict", min_length=1)

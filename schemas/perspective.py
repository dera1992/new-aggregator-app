from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PerspectiveRequest(BaseModel):
    cluster_id: int
    tone: Literal["genz", "neutral", "professional"] = "genz"
    slang_level: Literal["none", "light", "heavy"] = "light"
    force_refresh: bool = False


class AngleCard(BaseModel):
    label: str
    summary: str
    key_points: list[str] = Field(default_factory=list)
    risks: list[str] | None = None
    slang_level: str | None = None


class EmotionScore(BaseModel):
    emotion: str
    score: float

    @field_validator("score", mode="after")
    @classmethod
    def clamp_score(cls, value: float) -> float:
        return max(0.0, min(1.0, value))


class SentimentBlock(BaseModel):
    top_emotions: list[EmotionScore] = Field(default_factory=list)
    top_questions: list[str] = Field(default_factory=list)
    shareable_claims: list[str] = Field(default_factory=list)


class BiasScore(BaseModel):
    value: float
    label: str

    @field_validator("value", mode="after")
    @classmethod
    def clamp_value(cls, value: float) -> float:
        return max(-1.0, min(1.0, value))


class ScoreBlock(BaseModel):
    bias: BiasScore
    clickbait: float
    evidence: float

    @field_validator("clickbait", "evidence", mode="after")
    @classmethod
    def clamp_probability(cls, value: float) -> float:
        return max(0.0, min(1.0, value))


class SourceItem(BaseModel):
    name: str
    url: str


class PerspectiveResponse(BaseModel):
    cluster_id: int
    neutral_facts: list[str] = Field(default_factory=list)
    what_we_know: list[str] = Field(default_factory=list)
    what_is_unclear: list[str] = Field(default_factory=list)
    angles: list[AngleCard] = Field(default_factory=list)
    sentiment: SentimentBlock
    scores: ScoreBlock
    sources: list[SourceItem] = Field(default_factory=list)
    generated_at: str

    @field_validator("generated_at", mode="before")
    @classmethod
    def ensure_iso_timestamp(cls, value: str) -> str:
        if isinstance(value, str):
            datetime.fromisoformat(value.replace("Z", "+00:00"))
            return value
        raise ValueError("generated_at must be an ISO timestamp string.")

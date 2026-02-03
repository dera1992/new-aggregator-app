from typing import Literal, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    summary: str = Field(..., min_length=10)
    format: Literal["brief", "standard", "deep"] = "standard"
    tone: Literal["neutral", "insightful", "skeptical", "optimistic"] = "insightful"
    audience: Literal["general", "business", "tech", "policy", "investors"] = "general"
    include_takeaways: bool = True
    include_counterpoints: bool = True
    include_what_to_watch: bool = True
    fact_mode: bool = True
    model: Optional[str] = None

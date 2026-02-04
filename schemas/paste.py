from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class PasteTextRequest(BaseModel):
    text: str = Field(..., min_length=50)
    fact_mode: bool = True
    model: Optional[str] = None


class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=50)
    style: Literal["short", "standard", "detailed"] = "standard"
    max_length: Optional[int] = Field(None, ge=30)
    fact_mode: bool = True
    model: Optional[str] = None


class URLRequest(BaseModel):
    url: HttpUrl

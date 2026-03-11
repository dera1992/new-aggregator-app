from __future__ import annotations

from typing import Literal
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup
from youtube_transcript_api import YouTubeTranscriptApi


class URLExtractError(Exception):
    pass


USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.split())


def _extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if host.endswith("youtu.be"):
        return parsed.path.strip("/") or None

    if "youtube.com" in host:
        query_video = parse_qs(parsed.query).get("v", [None])[0]
        if query_video:
            return query_video
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2 and parts[0] in {"shorts", "embed", "live"}:
            return parts[1]

    return None


def _extract_html_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript", "iframe", "svg", "form"]):
        tag.decompose()

    container = soup.find("article") or soup.find("main") or soup.body or soup
    text = _normalize_whitespace(container.get_text(" ", strip=True))
    if len(text) < 50:
        raise URLExtractError("Could not extract enough readable content from this URL.")
    return text


def _extract_youtube_text(video_id: str) -> str:
    try:
        # 0.6.x+ uses an instance-based API: YouTubeTranscriptApi().fetch(video_id)
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
        snippets = list(transcript)
    except Exception as exc:
        msg = str(exc).lower()
        if "disabled" in msg:
            raise URLExtractError("Transcripts are disabled for this YouTube video.")
        if "unavailable" in msg or "private" in msg:
            raise URLExtractError("This YouTube video is unavailable.")
        if "no transcript" in msg or "could not find" in msg or "language" in msg:
            raise URLExtractError("No English transcript available for this YouTube video.")
        raise URLExtractError(f"Could not retrieve transcript: {exc}") from exc

    text = _normalize_whitespace(
        " ".join(
            s["text"] if isinstance(s, dict) else getattr(s, "text", "")
            for s in snippets
        )
    )
    if len(text) < 50:
        raise URLExtractError("Could not extract enough transcript text from this YouTube video.")
    return text


def extract_text_from_url(url: str) -> dict[str, str]:
    video_id = _extract_video_id(url)
    source_type: Literal["youtube", "article"] = "youtube" if video_id else "article"

    if video_id:
        text = _extract_youtube_text(video_id)
        return {
            "text": text,
            "source_type": source_type,
        }

    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=(5, 20),
    )
    response.raise_for_status()

    text = _extract_html_text(response.text)
    return {
        "text": text,
        "source_type": source_type,
    }

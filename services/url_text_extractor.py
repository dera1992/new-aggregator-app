from __future__ import annotations

from html import unescape
from typing import Literal
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup


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
    list_url = f"https://video.google.com/timedtext?type=list&v={video_id}"
    list_resp = requests.get(
        list_url,
        headers={"User-Agent": USER_AGENT},
        timeout=(5, 20),
    )
    list_resp.raise_for_status()

    list_soup = BeautifulSoup(list_resp.text, "xml")
    tracks = list_soup.find_all("track")
    if not tracks:
        raise URLExtractError("No captions/transcript available for this YouTube video.")

    selected = None
    for track in tracks:
        if (track.get("lang_code") or "").startswith("en"):
            selected = track
            break
    if selected is None:
        selected = tracks[0]

    lang_code = selected.get("lang_code", "en")
    name = selected.get("name", "")
    transcript_url = f"https://video.google.com/timedtext?v={video_id}&lang={lang_code}&fmt=srv3"
    if name:
        transcript_url += f"&name={requests.utils.quote(name)}"

    transcript_resp = requests.get(
        transcript_url,
        headers={"User-Agent": USER_AGENT},
        timeout=(5, 20),
    )
    transcript_resp.raise_for_status()

    transcript_soup = BeautifulSoup(transcript_resp.text, "xml")
    segments = []
    for item in transcript_soup.find_all("text"):
        if item.text:
            cleaned = _normalize_whitespace(unescape(item.text))
            if cleaned:
                segments.append(cleaned)

    transcript = " ".join(segments)
    if len(transcript) < 50:
        raise URLExtractError("Could not extract enough transcript text from this YouTube video.")

    return transcript


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

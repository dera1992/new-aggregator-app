from pathlib import Path
import sys

repo_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo_root))

from services.perspective_generator import _normalize_perspective_payload


def test_normalize_perspective_payload_handles_dict_angles_missing_bias_label_and_string_sources():
    payload = {
        "angles": {
            "Supporters": ["Point A", "Point B"],
            "Critics": "Concern raised",
        },
        "scores": {"bias": {"value": -0.2}, "clickbait": 0.1, "evidence": 0.8},
        "sources": ["https://example.com/story"],
    }

    normalized = _normalize_perspective_payload(
        payload,
        fallback_sources=[{"name": "Fallback", "url": "https://fallback.example"}],
    )

    assert isinstance(normalized["angles"], list)
    assert normalized["angles"][0]["label"] == "Supporters"
    assert normalized["angles"][0]["key_points"] == ["Point A", "Point B"]
    assert normalized["scores"]["bias"]["label"] == "left"
    assert normalized["sources"] == [{"name": "Unknown", "url": "https://example.com/story"}]


def test_normalize_perspective_payload_uses_fallback_sources_when_missing_or_invalid():
    fallback_sources = [{"name": "Reuters", "url": "https://reuters.example"}]
    payload = {"angles": [], "scores": {"bias": {"value": 0.0, "label": "neutral"}}, "sources": None}

    normalized = _normalize_perspective_payload(payload, fallback_sources=fallback_sources)

    assert normalized["sources"] == fallback_sources

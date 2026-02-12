import importlib
import os
import sys
from pathlib import Path

import jwt


def test_news_feed_filters_and_story_endpoint(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User
    Article = importlib.import_module("models.models").Article

    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(email="test@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

        article = Article(
            title="Test Story",
            source_url="https://example.com/story",
            source_domain="example.com",
            raw_content="content",
            ai_summary="summary",
            category="Tech",
            cluster_id=123,
        )
        db.session.add(article)
        archive_article = Article(
            title="Old Sports Story",
            source_url="https://sports.example.com/story",
            source_domain="sports.example.com",
            raw_content="content",
            ai_summary="sports summary",
            category="Sports",
            cluster_id=None,
        )
        db.session.add(archive_article)
        db.session.commit()

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    with app.test_client() as client:
        feed_response = client.get("/api/news/feed?category=Tech&limit=10", headers=headers)
        assert feed_response.status_code == 200
        payload = feed_response.get_json()
        assert payload["count"] == 1
        assert payload["stories"][0]["summary"] == "summary"

        story_response = client.get("/api/news/story/123", headers=headers)
        assert story_response.status_code == 200
        story_payload = story_response.get_json()
        assert story_payload["cluster_id"] == 123

        archive_response = client.get("/api/news/archive?category=Sports", headers=headers)
        assert archive_response.status_code == 200
        archive_payload = archive_response.get_json()
        assert archive_payload["count"] == 1
        assert archive_payload["articles"][0]["category"] == "Sports"


def test_generate_comment_uses_router_cache(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_comment.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    models = importlib.import_module("models.models")
    User = models.User
    AIOutputCache = models.AIOutputCache

    calls = {"count": 0}

    def fake_generate_comment(**_kwargs):
        calls["count"] += 1
        return {"variants": [{"text": f"comment-{calls['count']}"}]}

    news_module = importlib.import_module("routes.news")
    monkeypatch.setattr(news_module, "generate_comment", fake_generate_comment)

    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(email="comment@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "summary": "A short story summary.",
        "platform": "Twitter",
        "style": "neutral",
        "audience": "builders",
        "max_variants": 1,
        "fact_mode": "strict",
    }

    with app.test_client() as client:
        first = client.post("/api/news/generate-comment", json=payload, headers=headers)
        second = client.post("/api/news/generate-comment", json=payload, headers=headers)

        assert first.status_code == 200
        assert second.status_code == 200
        assert first.get_json() == second.get_json()
        assert calls["count"] == 1

        refreshed = client.post(
            "/api/news/generate-comment",
            json={**payload, "force_refresh": True},
            headers=headers,
        )
        assert refreshed.status_code == 200
        assert calls["count"] == 2

    with app.app_context():
        assert AIOutputCache.query.filter_by(task_type="comment").count() >= 1


def test_generate_joke_uses_router_cache(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_joke.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User

    calls = {"count": 0}

    def fake_generate_joke(**_kwargs):
        calls["count"] += 1
        return {
            "best_variant_index": 0,
            "warnings": [],
            "jokes": [{"style": "pun", "setup": "s", "punchline": "p", "full_joke": f"j-{calls['count']}", "cta": "c"}],
        }

    news_module = importlib.import_module("routes.news")
    monkeypatch.setattr(news_module, "generate_joke", fake_generate_joke)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(email="joke@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "summary": "Summary for joke endpoint",
        "platform": "Twitter",
        "style": "pun",
        "audience": "general",
        "max_variants": 1,
        "fact_mode": True,
    }

    with app.test_client() as client:
        assert client.post("/api/news/generate-joke", json=payload, headers=headers).status_code == 200
        assert client.post("/api/news/generate-joke", json=payload, headers=headers).status_code == 200

    assert calls["count"] == 1


def test_generate_viral_post_uses_router_cache(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_viral.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User

    calls = {"count": 0}

    def fake_generate_viral_post(**_kwargs):
        calls["count"] += 1
        return {"variants": [{"text": f"v-{calls['count']}"}]}

    news_module = importlib.import_module("routes.news")
    monkeypatch.setattr(news_module, "generate_viral_post", fake_generate_viral_post)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(email="viral@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "summary": "summary text",
        "platform": "twitter",
        "tone": "playful",
        "goal": "engagement",
        "audience": "founders",
        "brand_voice": "bold",
        "max_variants": 1,
        "fact_mode": "strict",
    }

    with app.test_client() as client:
        assert client.post("/api/news/generate-viral-post", json=payload, headers=headers).status_code == 200
        assert client.post("/api/news/generate-viral-post", json=payload, headers=headers).status_code == 200

    assert calls["count"] == 1


def test_generate_analysis_uses_router_cache(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_analysis.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User

    calls = {"count": 0}

    def fake_generate_analysis(**_kwargs):
        calls["count"] += 1
        return {
            "variants": [{"title": "Analysis", "body": f"a-{calls['count']}"}],
            "warnings": [],
            "best_variant_index": 0,
        }

    news_module = importlib.import_module("routes.news")
    monkeypatch.setattr(news_module, "generate_analysis", fake_generate_analysis)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(email="analysis@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "summary": "This is a sufficiently long summary for analysis generation.",
        "format": "standard",
        "tone": "insightful",
        "audience": "general",
        "include_takeaways": True,
        "include_counterpoints": True,
        "include_what_to_watch": True,
        "fact_mode": True,
    }

    with app.test_client() as client:
        assert client.post("/api/news/generate-analysis", json=payload, headers=headers).status_code == 200
        assert client.post("/api/news/generate-analysis", json=payload, headers=headers).status_code == 200

    assert calls["count"] == 1


def test_generate_perspective_uses_router_cache(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_perspective.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User

    calls = {"count": 0}

    def fake_generate_perspective(*, cluster_id, tone, slang_level):
        calls["count"] += 1
        return {
            "cluster_id": cluster_id,
            "neutral_facts": ["fact"],
            "what_we_know": ["know"],
            "what_is_unclear": ["unclear"],
            "angles": [],
            "sentiment": {"top_emotions": [], "top_questions": [], "shareable_claims": []},
            "scores": {"bias": {"value": 0.0, "label": "neutral"}, "clickbait": 0.1, "evidence": 0.8},
            "sources": [],
            "generated_at": f"2026-01-01T00:00:0{calls['count']}Z",
            "tone": tone,
            "slang_level": slang_level,
        }

    news_module = importlib.import_module("routes.news")
    monkeypatch.setattr(news_module, "generate_perspective", fake_generate_perspective)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(email="perspective@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"cluster_id": 42, "tone": "neutral", "slang_level": "light"}

    with app.test_client() as client:
        first = client.post("/api/news/generate-perspective", json=payload, headers=headers)
        second = client.post("/api/news/generate-perspective", json=payload, headers=headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.get_json()["cluster_id"] == 42
        assert second.get_json()["cluster_id"] == 42

    assert calls["count"] == 1

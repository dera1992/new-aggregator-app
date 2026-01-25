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

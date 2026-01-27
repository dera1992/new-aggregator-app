import importlib
import sys
from pathlib import Path

import jwt


def _setup_app(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "prefs.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)
    return app_module


def test_preferences_personalized_feed_and_saved_reads(tmp_path, monkeypatch):
    app_module = _setup_app(tmp_path, monkeypatch)
    app = app_module.app
    db = app_module.db
    models = importlib.import_module("models.models")
    User = models.User
    Article = models.Article

    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(email="prefs@example.com")
        user.set_password("password")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

        tech_article = Article(
            title="Tech Story",
            source_url="https://example.com/tech",
            source_domain="example.com",
            raw_content="content",
            ai_summary="summary",
            category="Tech",
            cluster_id=101,
        )
        sports_article = Article(
            title="Sports Story",
            source_url="https://sports.example.com/story",
            source_domain="sports.example.com",
            raw_content="content",
            ai_summary="sports summary",
            category="Sports",
            cluster_id=102,
        )
        db.session.add_all([tech_article, sports_article])
        db.session.commit()

        tech_id = tech_article.id

    token = jwt.encode({"user_id": user_id}, app.config["SECRET_KEY"], algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    with app.test_client() as client:
        prefs_response = client.put(
            "/api/user/preferences",
            json={
                "preferred_categories": ["Tech"],
                "preferred_sources": ["example.com"],
                "digest_time": "08:00",
                "digest_enabled": True,
            },
            headers=headers,
        )
        assert prefs_response.status_code == 200

        feed_response = client.get("/api/news/personalized", headers=headers)
        assert feed_response.status_code == 200
        feed_payload = feed_response.get_json()
        assert feed_payload["count"] == 1
        assert feed_payload["stories"][0]["summary"] == "summary"

        save_response = client.post(
            "/api/news/save",
            json={"article_id": tech_id},
            headers=headers,
        )
        assert save_response.status_code == 201

        saved_response = client.get("/api/news/saved", headers=headers)
        assert saved_response.status_code == 200
        assert saved_response.get_json()["count"] == 1

        read_response = client.post(
            "/api/news/read",
            json={"article_id": tech_id},
            headers=headers,
        )
        assert read_response.status_code == 201

        read_list_response = client.get("/api/news/read-articles", headers=headers)
        assert read_list_response.status_code == 200
        assert read_list_response.get_json()["count"] == 1

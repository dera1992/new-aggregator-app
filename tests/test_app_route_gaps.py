from datetime import datetime, timedelta
from io import BytesIO
from types import SimpleNamespace

from tests.conftest import FakeRedis, auth_headers, create_user, make_token


def test_health_and_csrf_protection(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    user_id = create_user(app_ctx)

    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "db": True}

    with app.app_context():
        monkeypatch.setattr(db.session, "execute", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("db down")))
        degraded = client.get("/health")

    assert degraded.status_code == 503
    assert degraded.get_json() == {"status": "degraded", "db": False}

    monkeypatch.setenv("CORS_ORIGINS", "http://frontend.test")
    response = app_ctx["app_module"].create_app().test_client().post(
        "/api/auth/register",
        json={"email": "blocked@example.com", "password": "password123"},
        headers={"Origin": "http://evil.test"},
    )
    assert response.status_code == 403

    authorized = client.post(
        "/api/news/save",
        json={},
        headers={
            **auth_headers(app, user_id),
            "Origin": "http://evil.test",
        },
    )
    assert authorized.status_code == 400
    assert authorized.get_json()["message"] == "article_id is required."


def test_auth_resend_refresh_and_logout(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    User = models.User

    user_id = create_user(app_ctx, email="refresh@example.com", confirmed=False)
    fake_redis = FakeRedis()

    auth_module = __import__("routes.auth", fromlist=["send_confirmation_email"])
    monkeypatch.setattr(auth_module, "send_confirmation_email", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(auth_module, "get_redis_client", lambda: fake_redis)

    resend = client.post(
        "/api/auth/resend-confirmation",
        json={"email": "refresh@example.com"},
        headers={"Origin": "http://frontend.test"},
    )
    assert resend.status_code == 200

    with app.app_context():
        user = db.session.get(User, user_id)
        user.is_email_confirmed = True
        db.session.commit()

    with app.app_context():
        access_token = auth_module._make_access_token(user_id)
        refresh_token = auth_module._make_refresh_token(user_id)
    client.set_cookie("refresh_token", refresh_token, path="/api/auth")

    refreshed = client.post("/api/auth/refresh", headers={"Origin": "http://frontend.test"})
    assert refreshed.status_code == 200
    assert refreshed.get_json()["token"]
    old_refresh_jti = auth_module.jwt.decode(refresh_token, app.config["SECRET_KEY"], algorithms=["HS256"])["jti"]
    assert fake_redis.get(f"blacklist:{old_refresh_jti}") == "1"

    logout = client.post(
        "/api/auth/logout",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Origin": "http://frontend.test",
        },
    )
    assert logout.status_code == 200
    assert logout.get_json()["message"] == "Logged out."
    decoded_access = auth_module.jwt.decode(access_token, app.config["SECRET_KEY"], algorithms=["HS256"])
    assert fake_redis.get(f"blacklist:{decoded_access['jti']}") == "1"
    assert "refresh_token=;" in logout.headers["Set-Cookie"]


def test_profile_routes_cover_create_update_and_avatar_upload(app_ctx, client):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    UserProfile = models.UserProfile
    user_id = create_user(app_ctx, email="profile@example.com")
    headers = auth_headers(app, user_id)

    fetched = client.get("/api/profile", headers=headers)
    assert fetched.status_code == 200
    assert fetched.get_json()["email"] == "profile@example.com"

    updated = client.put(
        "/api/profile",
        json={"full_name": "Test User", "timezone": "Europe/London"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.get_json()["full_name"] == "Test User"

    invalid = client.post(
        "/api/profile/avatar",
        data={"avatar": (BytesIO(b"plain-text"), "avatar.txt")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert invalid.status_code == 400

    uploaded = client.post(
        "/api/profile/avatar",
        data={"avatar": (BytesIO(b"\x89PNG\r\n\x1a\n"), "avatar.png")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert uploaded.status_code == 200
    avatar_url = uploaded.get_json()["avatar_url"]
    assert avatar_url.startswith("http://api.test/uploads/avatars/")

    with app.app_context():
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        assert profile.avatar_url == avatar_url

    filename = avatar_url.rsplit("/", 1)[1]
    served = client.get(f"/uploads/avatars/{filename}")
    assert served.status_code == 200


def test_preferences_admin_and_news_utility_routes(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    Article = models.Article

    admin_id = create_user(app_ctx, email="admin@example.com", role="admin")
    user_id = create_user(app_ctx, email="reader@example.com")
    admin_headers = auth_headers(app, admin_id)
    user_headers = auth_headers(app, user_id)

    with app.app_context():
        article = Article(
            title="Utility Story",
            source_url="https://example.com/utility",
            source_domain="example.com",
            raw_content="This article body is long enough to matter for tests.",
            ai_summary="Existing summary",
            category="Tech",
            cluster_id=77,
            created_at=datetime.utcnow() - timedelta(hours=1),
        )
        db.session.add(article)
        db.session.commit()
        article_id = article.id

    prefs = client.get("/api/user/preferences", headers=user_headers)
    assert prefs.status_code == 200
    assert prefs.get_json()["preferred_categories"] == []

    invalid_prefs = client.put(
        "/api/user/preferences",
        json={"digest_time": "25:99"},
        headers=user_headers,
    )
    assert invalid_prefs.status_code == 400

    save = client.post("/api/news/save", json={"article_id": article_id}, headers=user_headers)
    assert save.status_code == 201
    unsave = client.delete(f"/api/news/save/{article_id}", headers=user_headers)
    assert unsave.status_code == 200

    read = client.post("/api/news/read", json={"article_id": article_id}, headers=user_headers)
    assert read.status_code == 201
    unread = client.delete(f"/api/news/read/{article_id}", headers=user_headers)
    assert unread.status_code == 200
    clear = client.delete("/api/news/read-articles", headers=user_headers)
    assert clear.status_code == 200

    news_module = __import__("routes.news", fromlist=["get_trending_topics"])
    monkeypatch.setattr(news_module, "get_trending_topics", lambda count=10: [f"topic-{i}" for i in range(count)])
    monkeypatch.setattr(news_module, "generate_perspective_from_text", lambda text, tone, slang_level: {
        "text": text,
        "tone": tone,
        "slang_level": slang_level,
    })
    monkeypatch.setattr(news_module, "extract_text_from_url", lambda url: {
        "text": "body text",
        "source_type": "article",
    })

    sources = client.get("/api/news/sources", headers=user_headers)
    assert sources.status_code == 200
    assert sources.get_json()["sources"] == ["example.com"]

    trends = client.get("/api/news/trends?count=2", headers=user_headers)
    assert trends.status_code == 200
    assert trends.get_json()["topics"] == ["topic-0", "topic-1"]

    perspective = client.post(
        "/api/news/generate-perspective-from-text",
        json={"text": "X" * 60, "tone": "sharp", "slang_level": "light"},
        headers=user_headers,
    )
    assert perspective.status_code == 200
    assert perspective.get_json()["tone"] == "sharp"

    extracted = client.post(
        "/api/news/extract-url-text",
        json={"url": "https://example.com/story"},
        headers=user_headers,
    )
    assert extracted.status_code == 200
    assert extracted.get_json()["source_type"] == "article"

    users = client.get("/api/admin/users", headers=admin_headers)
    assert users.status_code == 200
    assert len(users.get_json()["users"]) >= 2

    updated_role = client.patch(
        f"/api/admin/users/{user_id}/role",
        json={"role": "editor"},
        headers=admin_headers,
    )
    assert updated_role.status_code == 200
    assert updated_role.get_json()["role"] == "editor"

    admin_module = __import__("routes.admin", fromlist=["cluster_recent_articles"])
    monkeypatch.setattr(admin_module, "cluster_recent_articles", lambda: None)
    clustered = client.post("/api/admin/run-cluster", headers=admin_headers)
    assert clustered.status_code == 200

    forbidden = client.get("/api/admin/users", headers=user_headers)
    assert forbidden.status_code == 403

"""
Tests for the AI credits system.

Covers:
- check_and_deduct_credits deducts correctly for free users
- check_and_deduct_credits returns 402 when balance is exhausted
- cache hits never deduct credits
- subscribed users are never blocked
- credits reset when ai_credits_reset_at is in the past
- GET /api/user/credits returns correct payload
"""
import importlib
import sys
from datetime import datetime, timedelta
from pathlib import Path

import jwt
import pytest


@pytest.fixture()
def app_ctx(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = tmp_path / "test_credits.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret-credits")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db

    models = importlib.import_module("models.models")
    User = models.User
    UserProfile = models.UserProfile
    AIUsageLog = models.AIUsageLog

    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app, db, User, UserProfile, AIUsageLog


def _make_token(user_id, secret="test-secret-credits"):
    return jwt.encode(
        {"user_id": user_id, "exp": datetime.utcnow() + timedelta(hours=1)},
        secret,
        algorithm="HS256",
    )


def _create_user(db, User, email="u@test.com", balance=10):
    user = User(
        email=email,
        ai_credits_balance=balance,
        ai_credits_reset_at=datetime.utcnow() + timedelta(days=30),
        is_email_confirmed=True,
    )
    user.set_password("pass")
    db.session.add(user)
    db.session.commit()
    return user


# ---------------------------------------------------------------------------
# Unit tests for check_and_deduct_credits
# ---------------------------------------------------------------------------

def test_deducts_credits_on_cache_miss(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=5)

        credits_module = importlib.import_module("utils.credits")
        result = credits_module.check_and_deduct_credits(user, "comment", cache_hit=False)

        assert result is None  # no error
        db.session.refresh(user)
        assert user.ai_credits_balance == 4  # 5 - 1

        log = AIUsageLog.query.filter_by(user_id=user.id).first()
        assert log is not None
        assert log.cache_hit is False
        assert log.credits_used == 1


def test_no_deduction_on_cache_hit(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=2)

        credits_module = importlib.import_module("utils.credits")
        result = credits_module.check_and_deduct_credits(user, "analysis", cache_hit=True)

        assert result is None
        db.session.refresh(user)
        assert user.ai_credits_balance == 2  # unchanged

        log = AIUsageLog.query.filter_by(user_id=user.id).first()
        assert log.cache_hit is True
        assert log.credits_used == 0


def test_returns_402_when_insufficient(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=1)

        credits_module = importlib.import_module("utils.credits")
        # analysis costs 3; user only has 1
        result = credits_module.check_and_deduct_credits(user, "analysis", cache_hit=False)

        assert result is not None
        response, status = result
        assert status == 402
        data = response.get_json()
        assert data["credits_balance"] == 1
        assert data["credits_required"] == 3

        # balance unchanged after a 402
        db.session.refresh(user)
        assert user.ai_credits_balance == 1


def test_subscribed_user_not_blocked(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=0)
        profile = UserProfile(
            user_id=user.id,
            subscription_tier="pro",
            subscription_status="active",
        )
        db.session.add(profile)
        db.session.commit()

        credits_module = importlib.import_module("utils.credits")
        result = credits_module.check_and_deduct_credits(user, "perspective", cache_hit=False)

        assert result is None  # subscribed users are never blocked
        db.session.refresh(user)
        assert user.ai_credits_balance == 0  # not deducted for subscribed users


def test_credits_reset_when_overdue(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=3)
        # Set reset date in the past to trigger auto-reset
        user.ai_credits_reset_at = datetime.utcnow() - timedelta(seconds=1)
        db.session.commit()

        credits_module = importlib.import_module("utils.credits")
        credits_module.check_and_deduct_credits(user, "comment", cache_hit=False)

        db.session.refresh(user)
        # Should have reset to 30 then deducted 1 (comment cost)
        assert user.ai_credits_balance == 29
        assert user.ai_credits_reset_at > datetime.utcnow()


# ---------------------------------------------------------------------------
# Integration test: GET /api/user/credits endpoint
# ---------------------------------------------------------------------------

def test_get_credits_endpoint(app_ctx):
    app, db, User, UserProfile, AIUsageLog = app_ctx
    with app.app_context():
        user = _create_user(db, User, balance=7, email="creds@test.com")
        profile = UserProfile(user_id=user.id, subscription_tier="free", subscription_status="inactive")
        db.session.add(profile)
        db.session.commit()
        token = _make_token(user.id)

    client = app.test_client()
    resp = client.get(
        "/api/user/credits",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["ai_credits_balance"] == 7
    assert data["plan"] == "free"
    assert data["subscription_status"] == "inactive"
    assert "ai_credits_reset_at" in data

import importlib
import sys
import hashlib
from pathlib import Path
from datetime import datetime, timedelta


def test_auth_flow_register_confirm_reset_change(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))

    db_path = Path(tmp_path) / "auth.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    User = importlib.import_module("models.models").User

    with app.app_context():
        db.drop_all()
        db.create_all()

    with app.test_client() as client:
        register_response = client.post(
            "/api/auth/register",
            json={"email": "user@example.com", "password": "supersecret"},
        )
        assert register_response.status_code == 201

        with app.app_context():
            user = User.query.filter_by(email="user@example.com").first()
            user.confirm_token_hash = hashlib.sha256("confirm-token".encode("utf-8")).hexdigest()
            user.confirm_token_expires_at = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()

        confirm_response = client.post(
            "/api/auth/confirm",
            json={"email": "user@example.com", "token": "confirm-token"},
        )
        assert confirm_response.status_code == 200

        login_response = client.post(
            "/api/auth/login",
            json={"email": "user@example.com", "password": "supersecret"},
        )
        assert login_response.status_code == 200
        token = login_response.get_json()["token"]

        forgot_response = client.post(
            "/api/auth/forgot-password",
            json={"email": "user@example.com"},
        )
        assert forgot_response.status_code == 200

        with app.app_context():
            user = User.query.filter_by(email="user@example.com").first()
            user.reset_token_hash = hashlib.sha256("reset-token".encode("utf-8")).hexdigest()
            user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()

        reset_response = client.post(
            "/api/auth/reset-password",
            json={
                "email": "user@example.com",
                "token": "reset-token",
                "new_password": "newpassword",
            },
        )
        assert reset_response.status_code == 200

        change_response = client.post(
            "/api/auth/change-password",
            json={"current_password": "newpassword", "new_password": "anotherpass"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert change_response.status_code == 200

import importlib
import sys
from pathlib import Path


def test_ai_router_caches_and_respects_force_refresh(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    db_path = Path(tmp_path) / "test_router.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    run_task = importlib.import_module("services.ai_router").run_task

    calls = {"count": 0}

    def generator_fn(**_kwargs):
        calls["count"] += 1
        return {"comment": f"hello-{calls['count']}"}

    with app.app_context():
        db.drop_all()
        db.create_all()

        first = run_task(
            "comment",
            input_text="news summary",
            params={"platform": "Twitter", "style": "neutral"},
            generator_fn=generator_fn,
        )
        second = run_task(
            "comment",
            input_text="news summary",
            params={"style": "neutral", "platform": "Twitter"},
            generator_fn=generator_fn,
        )
        refreshed = run_task(
            "comment",
            input_text="news summary",
            params={"platform": "Twitter", "style": "neutral"},
            force_refresh=True,
            generator_fn=generator_fn,
        )

    assert first["cache_hit"] is False
    assert second["cache_hit"] is True
    assert refreshed["cache_hit"] is False
    assert calls["count"] == 2


def test_select_model_quality_tiers():
    ai_router = importlib.import_module("services.ai_router")
    assert ai_router.select_model("comment", quality="standard") == "gpt-5-mini"
    assert ai_router.select_model("analysis", quality="premium") == "gpt-5.2"

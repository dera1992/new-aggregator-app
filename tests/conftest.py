import importlib
import sys
from datetime import datetime, timedelta
from pathlib import Path
from types import ModuleType, SimpleNamespace

import jwt
import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _install_test_stubs():
    if "sentry_sdk" not in sys.modules:
        sentry_stub = ModuleType("sentry_sdk")
        sentry_stub.init = lambda *args, **kwargs: None
        sys.modules["sentry_sdk"] = sentry_stub

    if "flask_cors" not in sys.modules:
        flask_cors_module = ModuleType("flask_cors")
        flask_cors_module.CORS = lambda *args, **kwargs: None
        sys.modules["flask_cors"] = flask_cors_module

    if "flask_limiter" not in sys.modules:
        flask_limiter_module = ModuleType("flask_limiter")
        flask_limiter_util = ModuleType("flask_limiter.util")

        class DummyLimiter:
            def __init__(self, *args, **kwargs):
                pass

            def init_app(self, app):
                return None

            def limit(self, *_args, **_kwargs):
                def decorator(func):
                    return func

                return decorator

        flask_limiter_module.Limiter = DummyLimiter
        flask_limiter_util.get_remote_address = lambda: "127.0.0.1"
        sys.modules["flask_limiter"] = flask_limiter_module
        sys.modules["flask_limiter.util"] = flask_limiter_util

    if "authlib.integrations.flask_client" not in sys.modules:
        authlib_module = ModuleType("authlib")
        integrations_module = ModuleType("authlib.integrations")
        flask_client_module = ModuleType("authlib.integrations.flask_client")

        class DummyOAuth:
            def init_app(self, app):
                return None

            def register(self, name, **kwargs):
                setattr(self, name, SimpleNamespace(
                    authorize_redirect=lambda uri: uri,
                    authorize_access_token=lambda: {},
                    userinfo=lambda: {},
                    get=lambda path: SimpleNamespace(json=lambda: {}),
                ))

        flask_client_module.OAuth = DummyOAuth
        sys.modules["authlib"] = authlib_module
        sys.modules["authlib.integrations"] = integrations_module
        sys.modules["authlib.integrations.flask_client"] = flask_client_module

    if "stripe" not in sys.modules:
        stripe_module = ModuleType("stripe")

        class StripeError(Exception):
            pass

        class SignatureVerificationError(Exception):
            pass

        stripe_module.api_key = ""
        stripe_module.error = SimpleNamespace(
            StripeError=StripeError,
            SignatureVerificationError=SignatureVerificationError,
        )
        stripe_module.Customer = SimpleNamespace(create=lambda **kwargs: SimpleNamespace(id="cus_test"))
        stripe_module.checkout = SimpleNamespace(
            Session=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(url="https://stripe.test/checkout"),
                retrieve=lambda *args, **kwargs: {},
            )
        )
        stripe_module.billing_portal = SimpleNamespace(
            Session=SimpleNamespace(create=lambda **kwargs: SimpleNamespace(url="https://stripe.test/portal"))
        )
        stripe_module.Invoice = SimpleNamespace(
            list=lambda **kwargs: SimpleNamespace(auto_paging_iter=lambda: iter([]))
        )
        stripe_module.Subscription = SimpleNamespace(
            modify=lambda *args, **kwargs: SimpleNamespace(),
            list=lambda **kwargs: SimpleNamespace(auto_paging_iter=lambda: iter([])),
            retrieve=lambda sub_id: {},
        )
        stripe_module.Webhook = SimpleNamespace(construct_event=lambda payload, sig, secret: {})
        stripe_module.Event = SimpleNamespace(construct_from=lambda payload, key: payload)
        sys.modules["stripe"] = stripe_module

    if "openai" not in sys.modules:
        openai_module = ModuleType("openai")

        class DummyOpenAI:
            def __init__(self, *args, **kwargs):
                self.responses = SimpleNamespace(create=lambda *a, **k: SimpleNamespace(output=[]))
                self.chat = SimpleNamespace(
                    completions=SimpleNamespace(
                        create=lambda *a, **k: SimpleNamespace(
                            choices=[SimpleNamespace(message=SimpleNamespace(content="{}"))]
                        )
                    )
                )

        openai_module.OpenAI = DummyOpenAI
        sys.modules["openai"] = openai_module

    if "bs4" not in sys.modules:
        bs4_module = ModuleType("bs4")

        class DummyBeautifulSoup:
            def __init__(self, html, parser):
                self.body = SimpleNamespace(get_text=lambda *args, **kwargs: html)

            def __call__(self, tags):
                return []

            def find(self, _name):
                return None

        bs4_module.BeautifulSoup = DummyBeautifulSoup
        sys.modules["bs4"] = bs4_module

    if "youtube_transcript_api" not in sys.modules:
        yta_module = ModuleType("youtube_transcript_api")

        class DummyYouTubeTranscriptApi:
            def fetch(self, video_id, languages=None):
                return [{"text": "transcript text " * 5}]

        yta_module.YouTubeTranscriptApi = DummyYouTubeTranscriptApi
        sys.modules["youtube_transcript_api"] = yta_module

    if "sentence_transformers" not in sys.modules:
        st_module = ModuleType("sentence_transformers")

        class DummySentenceTransformer:
            def __init__(self, *args, **kwargs):
                pass

            def encode(self, texts):
                return [[0.0] * 3 for _ in texts]

        st_module.SentenceTransformer = DummySentenceTransformer
        sys.modules["sentence_transformers"] = st_module

    if "sklearn" not in sys.modules:
        sklearn_module = ModuleType("sklearn")
        cluster_module = ModuleType("sklearn.cluster")
        metrics_module = ModuleType("sklearn.metrics")
        pairwise_module = ModuleType("sklearn.metrics.pairwise")

        class DummyAgglomerativeClustering:
            def __init__(self, *args, **kwargs):
                pass

            def fit_predict(self, distances):
                return [0 for _ in distances]

        cluster_module.AgglomerativeClustering = DummyAgglomerativeClustering
        pairwise_module.cosine_similarity = lambda embeddings: [[1.0 for _ in embeddings] for _ in embeddings]

        sys.modules["sklearn"] = sklearn_module
        sys.modules["sklearn.cluster"] = cluster_module
        sys.modules["sklearn.metrics"] = metrics_module
        sys.modules["sklearn.metrics.pairwise"] = pairwise_module

    if "pytrends" not in sys.modules:
        pytrends_module = ModuleType("pytrends")
        request_module = ModuleType("pytrends.request")
        request_module.TrendReq = lambda *args, **kwargs: SimpleNamespace(trending_searches=lambda pn="united_states": [])
        sys.modules["pytrends"] = pytrends_module
        sys.modules["pytrends.request"] = request_module


_install_test_stubs()


@pytest.fixture()
def app_ctx(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("RUN_BACKGROUND_JOBS", "false")
    monkeypatch.setenv("TESTING", "1")
    monkeypatch.setenv("FRONTEND_URL", "http://frontend.test")
    monkeypatch.setenv("API_BASE_URL", "http://api.test")
    monkeypatch.setenv("CORS_ORIGINS", "http://frontend.test")

    _install_test_stubs()

    redis_module = importlib.import_module("utils.redis_client")
    redis_module.get_redis_client.cache_clear()

    app_module = importlib.import_module("app")
    importlib.reload(app_module)

    app = app_module.app
    db = app_module.db
    models = importlib.import_module("models.models")

    with app.app_context():
        db.drop_all()
        db.create_all()

    yield {
        "app_module": app_module,
        "app": app,
        "db": db,
        "models": models,
    }


@pytest.fixture()
def client(app_ctx):
    return app_ctx["app"].test_client()


def make_token(app, user_id, *, token_type=None, jti=None, exp_hours=1):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=exp_hours),
    }
    if token_type:
        payload["type"] = token_type
    if jti:
        payload["jti"] = jti
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def auth_headers(app, user_id, **token_kwargs):
    token = make_token(app, user_id, **token_kwargs)
    return {"Authorization": f"Bearer {token}"}


def create_user(app_ctx, *, email="user@example.com", password="password123", role="user", confirmed=True, active=True):
    db = app_ctx["db"]
    models = app_ctx["models"]
    User = models.User

    with app_ctx["app"].app_context():
        user = User(
            email=email,
            role=role,
            is_email_confirmed=confirmed,
            is_active=active,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user.id


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.expiring = {}

    def get(self, key):
        if key in self.expiring:
            return self.expiring[key][1]
        return self.values.get(key)

    def set(self, key, value, nx=False, ex=None):
        if nx and (key in self.values or key in self.expiring):
            return False
        self.values[key] = value
        return True

    def setex(self, key, ttl, value):
        self.expiring[key] = (ttl, value)

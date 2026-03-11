import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from extensions import limiter, oauth
from models.models import db
from routes.news import news_bp
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.profile import profile_bp
from routes.preferences import preferences_bp
from routes.oauth import oauth_bp


def create_app():
    app = Flask(__name__)
    cors_origins_env = os.getenv("CORS_ORIGINS")
    if not cors_origins_env:
        cors_origins = "*"
    elif cors_origins_env.strip() == "*":
        cors_origins = "*"
    else:
        cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost/news_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_jwt_secret_key")
    app.config["FRONTEND_URL"] = os.getenv("FRONTEND_URL", "http://localhost:3000")
    app.config["API_BASE_URL"] = os.getenv("API_BASE_URL", "http://localhost:8080")
    app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID', '')
    app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET', '')
    app.config['FACEBOOK_CLIENT_ID'] = os.getenv('FACEBOOK_APP_ID', '')
    app.config['FACEBOOK_CLIENT_SECRET'] = os.getenv('FACEBOOK_APP_SECRET', '')
    app.config['X_CLIENT_ID'] = os.getenv('X_CLIENT_ID', '')
    app.config['X_CLIENT_SECRET'] = os.getenv('X_CLIENT_SECRET', '')

    # Use Redis for rate-limit storage when available, fall back to memory
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        app.config["RATELIMIT_STORAGE_URI"] = redis_url
    limiter.init_app(app)
    oauth.init_app(app)

    oauth.register(
        name='google',
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )
    oauth.register(
        name='facebook',
        api_base_url='https://graph.facebook.com/',
        access_token_url='https://graph.facebook.com/oauth/access_token',
        authorize_url='https://www.facebook.com/dialog/oauth',
        client_kwargs={'scope': 'email public_profile'},
    )
    oauth.register(
        name='x',
        api_base_url='https://api.twitter.com/2/',
        access_token_url='https://api.twitter.com/2/oauth2/token',
        authorize_url='https://twitter.com/i/oauth2/authorize',
        client_kwargs={
            'scope': 'tweet.read users.read offline.access',
            'code_challenge_method': 'S256',
        },
    )

    # CSRF protection: reject state-changing requests whose Origin/Referer
    # doesn't match an allowed origin. JWT-in-Authorization-header already
    # prevents classic CSRF, but this adds defense-in-depth for any future
    # cookie-based flows.
    allowed_origins = (
        [o.strip() for o in cors_origins_env.split(",") if o.strip()]
        if cors_origins_env and cors_origins_env.strip() != "*"
        else []
    )

    @app.before_request
    def csrf_protect():
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return
        # Requests with a valid Bearer token are already unforgeable from
        # cross-origin pages, so only check unauthenticated mutation endpoints.
        if request.headers.get("Authorization", "").startswith("Bearer "):
            return
        if not allowed_origins:
            # CORS_ORIGINS not configured — skip enforcement in dev.
            return
        origin = request.headers.get("Origin") or request.headers.get("Referer", "")
        if not any(origin.startswith(o) for o in allowed_origins):
            return jsonify({"message": "CSRF check failed: origin not allowed."}), 403

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(oauth_bp)

    db.init_app(app)
    return app

app = create_app()

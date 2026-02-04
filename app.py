import os
from flask import Flask
from flask_cors import CORS
from models.models import db
from routes.news import news_bp
from routes.auth import auth_bp
from routes.preferences import preferences_bp

def create_app():
    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
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

    app.register_blueprint(auth_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(preferences_bp)

    db.init_app(app)
    return app

app = create_app()

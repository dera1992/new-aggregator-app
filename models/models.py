from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt
import hashlib

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    source_url = db.Column(db.String(500), unique=True, nullable=False)
    source_domain = db.Column(db.String(255), index=True)
    raw_content = db.Column(db.Text)
    ai_summary = db.Column(db.Text)
    summary_style = db.Column(db.String(50), default="bullets-3")
    summary_error = db.Column(db.Text)
    category = db.Column(db.String(50))
    cluster_id = db.Column(db.Integer)
    content_hash = db.Column(db.String(64), unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)

    def set_content_hash(self):
        payload = f"{self.title}|{self.source_url}|{self.raw_content or ''}"
        self.content_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

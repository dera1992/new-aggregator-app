from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt
import hashlib

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), default="user", nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_email_confirmed = db.Column(db.Boolean, default=False)
    email_confirmed_at = db.Column(db.DateTime)
    confirm_token_hash = db.Column(db.String(64), index=True)
    confirm_token_expires_at = db.Column(db.DateTime)
    reset_token_hash = db.Column(db.String(64), index=True)
    reset_token_expires_at = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.password_changed_at = datetime.utcnow()

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))


class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    full_name = db.Column(db.String(120))
    timezone = db.Column(db.String(50), default="UTC")
    avatar_url = db.Column(db.String(500))
    subscription_tier = db.Column(db.String(50), default="free")
    subscription_status = db.Column(db.String(50), default="inactive")
    subscription_expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    source_url = db.Column(db.String(500), unique=True, nullable=False)
    source_domain = db.Column(db.String(255), index=True)
    raw_content = db.Column(db.Text)
    ai_summary = db.Column(db.Text)
    summary_style = db.Column(db.String(50), default="bullets-3")
    summary_error = db.Column(db.Text)
    fetch_status= db.Column(db.String(50))
    rss_summary= db.Column(db.Text)
    category = db.Column(db.String(50))
    cluster_id = db.Column(db.Integer)
    content_hash = db.Column(db.String(64), unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)

    def set_content_hash(self):
        payload = f"{self.title}|{self.source_url}|{self.raw_content or ''}"
        self.content_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()


class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    preferred_categories = db.Column(db.JSON, default=list)
    preferred_sources = db.Column(db.JSON, default=list)
    digest_time = db.Column(db.String(5), default="08:00")
    digest_enabled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SavedArticle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey("article.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "article_id", name="uniq_user_saved"),)


class ReadArticle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey("article.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "article_id", name="uniq_user_read"),)

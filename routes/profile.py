import os
import uuid
from flask import Blueprint, jsonify, request, g, current_app, send_from_directory
from werkzeug.utils import secure_filename
from models.models import db, UserProfile
from utils.decorators import token_required
from utils.credits import get_credits_info

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

profile_bp = Blueprint("profile", __name__)


def serialize_profile(profile: UserProfile):
    return {
        "email": g.current_user.email,
        "full_name": profile.full_name,
        "timezone": profile.timezone,
        "avatar_url": profile.avatar_url,
        "subscription_tier": profile.subscription_tier,
        "subscription_status": profile.subscription_status,
        "subscription_expires_at": (
            profile.subscription_expires_at.isoformat() if profile.subscription_expires_at else None
        ),
    }


@profile_bp.route("/api/profile", methods=["GET"])
@token_required
def get_profile():
    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=g.current_user.id)
        db.session.add(profile)
        db.session.commit()
    return jsonify(serialize_profile(profile)), 200


@profile_bp.route("/api/user/credits", methods=["GET"])
@token_required
def get_user_credits():
    return jsonify(get_credits_info(g.current_user)), 200


@profile_bp.route("/api/profile/avatar", methods=["POST"])
@token_required
def upload_avatar():
    if "avatar" not in request.files:
        return jsonify({"message": "No file provided."}), 400

    file = request.files["avatar"]
    if not file.filename or not _allowed(file.filename):
        return jsonify({"message": "Invalid file type. Allowed: jpg, png, webp, gif."}), 400

    # Check size before reading fully
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_AVATAR_BYTES:
        return jsonify({"message": "File too large. Maximum size is 2 MB."}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"

    upload_dir = os.path.join(current_app.root_path, "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    base_url = current_app.config.get("API_BASE_URL", "http://localhost:8080").rstrip("/")
    avatar_url = f"{base_url}/uploads/avatars/{filename}"

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=g.current_user.id)
        db.session.add(profile)
    profile.avatar_url = avatar_url
    db.session.commit()

    return jsonify({"avatar_url": avatar_url}), 200


@profile_bp.route("/uploads/avatars/<filename>")
def serve_avatar(filename):
    upload_dir = os.path.join(current_app.root_path, "uploads", "avatars")
    return send_from_directory(upload_dir, filename)


@profile_bp.route("/api/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json(silent=True) or {}
    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=g.current_user.id)
        db.session.add(profile)

    for field in ["full_name", "timezone", "avatar_url"]:
        if field in data:
            setattr(profile, field, data.get(field))

    db.session.commit()
    return jsonify(serialize_profile(profile)), 200

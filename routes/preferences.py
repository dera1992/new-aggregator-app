import re
from flask import Blueprint, jsonify, request, g
from models.models import db, UserPreferences
from utils.decorators import token_required

preferences_bp = Blueprint("preferences", __name__)


def _normalize_list(value):
    if value is None:
        return []
    if not isinstance(value, list):
        return None
    return [str(item).strip() for item in value if str(item).strip()]


def _is_valid_digest_time(value):
    if value is None:
        return True
    return re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", value) is not None


def _get_or_create_preferences(user_id):
    preferences = UserPreferences.query.filter_by(user_id=user_id).first()
    if not preferences:
        preferences = UserPreferences(user_id=user_id)
        db.session.add(preferences)
        db.session.commit()
    return preferences


@preferences_bp.route("/api/user/preferences", methods=["GET"])
@token_required
def get_preferences():
    preferences = _get_or_create_preferences(g.current_user.id)
    return jsonify({
        "preferred_categories": preferences.preferred_categories or [],
        "preferred_sources": preferences.preferred_sources or [],
        "digest_time": preferences.digest_time,
        "digest_enabled": preferences.digest_enabled,
    })


@preferences_bp.route("/api/user/preferences", methods=["PUT"])
@token_required
def update_preferences():
    data = request.get_json(silent=True) or {}
    categories = _normalize_list(data.get("preferred_categories"))
    sources = _normalize_list(data.get("preferred_sources"))
    digest_time = data.get("digest_time")
    digest_enabled = data.get("digest_enabled")

    if categories is None:
        return jsonify({"message": "preferred_categories must be a list."}), 400
    if sources is None:
        return jsonify({"message": "preferred_sources must be a list."}), 400
    if not _is_valid_digest_time(digest_time):
        return jsonify({"message": "digest_time must be HH:MM (24h)."}), 400
    if digest_enabled is not None and not isinstance(digest_enabled, bool):
        return jsonify({"message": "digest_enabled must be a boolean."}), 400

    preferences = _get_or_create_preferences(g.current_user.id)
    if categories is not None:
        preferences.preferred_categories = categories
    if sources is not None:
        preferences.preferred_sources = sources
    if digest_time is not None:
        preferences.digest_time = digest_time
    if digest_enabled is not None:
        preferences.digest_enabled = digest_enabled

    db.session.commit()
    return jsonify({
        "preferred_categories": preferences.preferred_categories or [],
        "preferred_sources": preferences.preferred_sources or [],
        "digest_time": preferences.digest_time,
        "digest_enabled": preferences.digest_enabled,
    })

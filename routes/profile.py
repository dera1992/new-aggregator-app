from flask import Blueprint, jsonify, request, g
from models.models import db, UserProfile
from utils.decorators import token_required

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


@profile_bp.route("/api/profile", methods=["OPTIONS"])
def profile_options():
    return "", 200


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

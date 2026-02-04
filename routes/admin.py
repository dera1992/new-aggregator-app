from flask import Blueprint, jsonify, request
from models.models import db, User
from utils.decorators import token_required, role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/api/admin/users", methods=["GET"])
@token_required
@role_required({"admin"})
def list_users():
    users = User.query.order_by(User.id).all()
    payload = [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_confirmed": user.is_email_confirmed,
        }
        for user in users
    ]
    return jsonify({"users": payload}), 200


@admin_bp.route("/api/admin/users", methods=["OPTIONS"])
def list_users_options():
    return "", 200


@admin_bp.route("/api/admin/users/<int:user_id>/role", methods=["PATCH"])
@token_required
@role_required({"admin"})
def update_user_role(user_id: int):
    data = request.get_json(silent=True) or {}
    new_role = data.get("role")
    if not new_role:
        return jsonify({"message": "Role is required."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    user.role = new_role
    db.session.commit()
    return jsonify({"message": "Role updated.", "user_id": user.id, "role": user.role}), 200


@admin_bp.route("/api/admin/users/<int:user_id>/role", methods=["OPTIONS"])
def update_user_role_options(user_id: int):
    return "", 200

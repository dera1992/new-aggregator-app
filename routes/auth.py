import jwt
import datetime
from flask import Blueprint, request, jsonify, current_app, g
from models.models import db, User
from services.email_service import send_email
from utils.auth import (
    generate_token,
    hash_token,
    normalize_email,
    is_valid_email,
    token_expiry,
)
from utils.decorators import token_required

auth_bp = Blueprint('auth', __name__)

MIN_PASSWORD_LENGTH = 8


def validate_password(password: str):
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    return None


def get_json_payload():
    return request.get_json(silent=True) or {}


def validate_email(email: str):
    if not is_valid_email(email):
        return "Email is invalid."
    return None


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = get_json_payload()
    email = normalize_email(data.get('email'))
    password = data.get('password')

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400

    error = validate_password(password)
    if error:
        return jsonify({"message": error}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    new_user = User(email=email)
    # set_password hashes the password using bcrypt (defined in models)
    new_user.set_password(password)

    confirm_token = generate_token()
    new_user.confirm_token_hash = hash_token(confirm_token)
    new_user.confirm_token_expires_at = token_expiry(hours=24)

    db.session.add(new_user)
    db.session.commit()

    send_email(
        to_email=email,
        subject="Confirm your account",
        body=f"Use this token to confirm your account: {confirm_token}",
    )

    return jsonify({"message": "User created successfully. Check email to confirm."}), 201


@auth_bp.route('/api/auth/confirm', methods=['POST'])
def confirm_email():
    data = get_json_payload()
    email = normalize_email(data.get('email'))
    token = data.get('token')

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400
    if not token:
        return jsonify({"message": "Confirmation token is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.confirm_token_hash:
        return jsonify({"message": "Invalid confirmation request"}), 400

    if user.confirm_token_expires_at and user.confirm_token_expires_at < datetime.datetime.utcnow():
        return jsonify({"message": "Confirmation token expired"}), 400

    if hash_token(token) != user.confirm_token_hash:
        return jsonify({"message": "Invalid confirmation token"}), 400

    user.is_email_confirmed = True
    user.email_confirmed_at = datetime.datetime.utcnow()
    user.confirm_token_hash = None
    user.confirm_token_expires_at = None
    db.session.commit()

    return jsonify({"message": "Email confirmed"}), 200


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = get_json_payload()
    email = normalize_email(data.get('email'))
    user = User.query.filter_by(email=email).first()
    password = data.get('password')

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400
    if not password:
        return jsonify({"message": "Password is required."}), 400

    # Verify password
    if user and user.check_password(password):
        if not user.is_email_confirmed:
            return jsonify({"message": "Email not confirmed"}), 403
        if not user.is_active:
            return jsonify({"message": "User inactive"}), 403
        # Create a token that expires in 24 hours
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token})

    return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route('/api/auth/resend-confirmation', methods=['POST'])
def resend_confirmation():
    data = get_json_payload()
    email = normalize_email(data.get('email'))

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.is_email_confirmed:
        return jsonify({"message": "Email already confirmed"}), 200

    confirm_token = generate_token()
    user.confirm_token_hash = hash_token(confirm_token)
    user.confirm_token_expires_at = token_expiry(hours=24)
    db.session.commit()

    send_email(
        to_email=email,
        subject="Confirm your account",
        body=f"Use this token to confirm your account: {confirm_token}",
    )
    return jsonify({"message": "Confirmation email resent"}), 200


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = get_json_payload()
    email = normalize_email(data.get('email'))

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If that account exists, a reset email has been sent."}), 200

    reset_token = generate_token()
    user.reset_token_hash = hash_token(reset_token)
    user.reset_token_expires_at = token_expiry(hours=2)
    db.session.commit()

    send_email(
        to_email=email,
        subject="Reset your password",
        body=f"Use this token to reset your password: {reset_token}",
    )
    return jsonify({"message": "If that account exists, a reset email has been sent."}), 200


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = get_json_payload()
    email = normalize_email(data.get('email'))
    token = data.get('token')
    new_password = data.get('new_password')

    email_error = validate_email(email)
    if email_error:
        return jsonify({"message": email_error}), 400
    if not token:
        return jsonify({"message": "Reset token is required."}), 400

    error = validate_password(new_password)
    if error:
        return jsonify({"message": error}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.reset_token_hash:
        return jsonify({"message": "Invalid reset request"}), 400

    if user.reset_token_expires_at and user.reset_token_expires_at < datetime.datetime.utcnow():
        return jsonify({"message": "Reset token expired"}), 400

    if hash_token(token) != user.reset_token_hash:
        return jsonify({"message": "Invalid reset token"}), 400

    user.set_password(new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.session.commit()
    return jsonify({"message": "Password reset successful"}), 200


@auth_bp.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_password():
    data = get_json_payload()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password:
        return jsonify({"message": "Current password is required."}), 400

    error = validate_password(new_password)
    if error:
        return jsonify({"message": error}), 400

    user = g.current_user
    if not user.check_password(current_password):
        return jsonify({"message": "Current password is incorrect"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200

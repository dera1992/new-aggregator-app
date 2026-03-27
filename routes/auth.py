import datetime
import uuid
from urllib.parse import urlencode

import jwt
from flask import Blueprint, request, jsonify, current_app, g, make_response
from models.models import db, User, UserProfile
from services.email_service import send_confirmation_email, send_password_reset_email
from utils.auth import (
    generate_token,
    hash_token,
    normalize_email,
    is_valid_email,
    token_expiry,
)
from utils.decorators import token_required
from utils.redis_client import get_redis_client
from extensions import limiter

ACCESS_TOKEN_MINUTES = 60
REFRESH_TOKEN_DAYS = 7


def _make_access_token(user_id: int) -> str:
    return jwt.encode({
        'user_id': user_id,
        'jti': str(uuid.uuid4()),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }, current_app.config['SECRET_KEY'], algorithm="HS256")


def _make_refresh_token(user_id: int) -> str:
    return jwt.encode({
        'user_id': user_id,
        'jti': str(uuid.uuid4()),
        'type': 'refresh',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_DAYS),
    }, current_app.config['SECRET_KEY'], algorithm="HS256")


def _set_refresh_cookie(response, refresh_token: str):
    is_prod = current_app.config.get('FLASK_ENV') != 'development'
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=is_prod,
        samesite='Lax',
        max_age=REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        path='/api/auth',
    )

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


def build_confirmation_link(email: str, token: str) -> str:
    base_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    query = urlencode({"email": email, "token": token})
    return f"{base_url}/confirm?{query}"


def build_reset_link(email: str, token: str) -> str:
    base_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    query = urlencode({"email": email, "token": token})
    return f"{base_url}/reset-password?{query}"


@auth_bp.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per hour")
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

    new_user.ai_credits_reset_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    db.session.add(new_user)
    db.session.commit()

    profile = UserProfile(user_id=new_user.id)
    db.session.add(profile)
    db.session.commit()

    confirmation_link = build_confirmation_link(email, confirm_token)
    send_confirmation_email(email, confirmation_link)

    return jsonify({"message": "User created successfully. Check email to confirm."}), 201


@auth_bp.route('/api/auth/confirm', methods=['POST'])
@limiter.limit("10 per hour")
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
@limiter.limit("10 per minute")
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

        access_token = _make_access_token(user.id)
        refresh_token = _make_refresh_token(user.id)
        resp = make_response(jsonify({'token': access_token}))
        _set_refresh_cookie(resp, refresh_token)
        return resp, 200

    return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route('/api/auth/resend-confirmation', methods=['POST'])
@limiter.limit("3 per hour")
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

    confirmation_link = build_confirmation_link(email, confirm_token)
    send_confirmation_email(email, confirmation_link)
    return jsonify({"message": "Confirmation email resent"}), 200


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
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

    reset_link = build_reset_link(email, reset_token)
    send_password_reset_email(email, reset_link)
    return jsonify({"message": "If that account exists, a reset email has been sent."}), 200


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
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
@limiter.limit("5 per hour")
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


@auth_bp.route('/api/auth/refresh', methods=['POST'])
@limiter.limit("30 per hour")
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "No refresh token."}), 401

    try:
        data = jwt.decode(refresh_token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        if data.get('type') != 'refresh':
            return jsonify({"message": "Invalid token type."}), 401

        jti = data.get('jti')
        redis = get_redis_client()
        if jti and redis and redis.get(f"blacklist:{jti}"):
            return jsonify({"message": "Token has been revoked."}), 401

        user = db.session.get(User, data.get("user_id"))
        if not user or not user.is_active:
            return jsonify({"message": "User not found."}), 401

        # Rotate: blacklist old refresh token, issue new pair
        if jti and redis:
            ttl = int(data['exp'] - datetime.datetime.utcnow().timestamp())
            if ttl > 0:
                redis.setex(f"blacklist:{jti}", ttl, "1")

        new_access = _make_access_token(user.id)
        new_refresh = _make_refresh_token(user.id)
        resp = make_response(jsonify({"token": new_access}))
        _set_refresh_cookie(resp, new_refresh)
        return resp, 200

    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Refresh token expired. Please log in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid refresh token."}), 401


@auth_bp.route('/api/auth/logout', methods=['POST'])
@token_required
def logout():
    # Blacklist the access token
    raw = request.headers.get('Authorization', '').replace('Bearer ', '') or request.cookies.get('access_token', '')
    if raw:
        try:
            data = jwt.decode(raw, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            jti = data.get('jti')
            if jti:
                redis = get_redis_client()
                if redis:
                    ttl = int(data['exp'] - datetime.datetime.utcnow().timestamp())
                    if ttl > 0:
                        redis.setex(f"blacklist:{jti}", ttl, "1")
        except jwt.InvalidTokenError:
            pass

    # Blacklist the refresh token too
    refresh_raw = request.cookies.get('refresh_token', '')
    if refresh_raw:
        try:
            data = jwt.decode(refresh_raw, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            jti = data.get('jti')
            if jti:
                redis = get_redis_client()
                if redis:
                    ttl = int(data['exp'] - datetime.datetime.utcnow().timestamp())
                    if ttl > 0:
                        redis.setex(f"blacklist:{jti}", ttl, "1")
        except jwt.InvalidTokenError:
            pass

    resp = make_response(jsonify({"message": "Logged out."}))
    resp.delete_cookie('refresh_token', path='/api/auth')
    return resp, 200

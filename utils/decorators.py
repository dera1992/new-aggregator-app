import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from models.models import User, db
from utils.redis_client import get_redis_client


def _extract_raw_token() -> str | None:
    """Return raw JWT string from Authorization header or access_token cookie."""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    return request.cookies.get('access_token')


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 204

        raw = _extract_raw_token()
        if not raw:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(raw, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            jti = data.get('jti')

            # Check Redis blacklist
            if jti:
                redis = get_redis_client()
                if redis and redis.get(f"blacklist:{jti}"):
                    return jsonify({'message': 'Token has been revoked.'}), 401

            user = db.session.get(User, data.get("user_id"))
            if not user or not user.is_active:
                return jsonify({'message': 'User is inactive or missing'}), 401
            g.current_user = user
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        except Exception:
            current_app.logger.exception("Unexpected token validation error.")
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(*args, **kwargs)
    return decorated


def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({'message': 'User is missing'}), 401
            if user.role not in set(allowed_roles):
                return jsonify({'message': 'User lacks required role'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

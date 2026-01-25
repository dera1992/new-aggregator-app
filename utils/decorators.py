import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from models.models import User, db

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            # Remove "Bearer " prefix if present
            data = jwt.decode(token.replace("Bearer ", ""), current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = db.session.get(User, data.get("user_id"))
            if not user or not user.is_active:
                return jsonify({'message': 'User is inactive or missing'}), 401
            g.current_user = user
        except Exception:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

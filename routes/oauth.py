from flask import Blueprint, redirect, url_for, current_app, request, jsonify
from models.models import db, User, UserProfile
from extensions import oauth
from routes.auth import _make_access_token, _make_refresh_token, _set_refresh_cookie

oauth_bp = Blueprint('oauth', __name__)

FRONTEND_URL = lambda: current_app.config.get('FRONTEND_URL', 'http://localhost:3000')


def _redirect_with_tokens(user):
    """Issue a proper access+refresh token pair and redirect to the frontend callback."""
    access_token = _make_access_token(user.id)
    refresh_token = _make_refresh_token(user.id)
    resp = redirect(f"{FRONTEND_URL()}/callback?token={access_token}")
    _set_refresh_cookie(resp, refresh_token)
    return resp


def _find_or_create_user(email, provider, provider_id, name=None, avatar_url=None):
    """Find existing user by oauth_provider_id, or by email, or create new."""
    # 1. Exact OAuth match
    user = User.query.filter_by(oauth_provider=provider, oauth_provider_id=str(provider_id)).first()
    if user:
        return user

    # 2. Existing email account — link it
    if email:
        user = User.query.filter_by(email=email).first()
        if user:
            user.oauth_provider = provider
            user.oauth_provider_id = str(provider_id)
            user.is_email_confirmed = True
            db.session.commit()
            return user

    # 3. Create new user
    user = User(
        email=email,
        password_hash=None,
        oauth_provider=provider,
        oauth_provider_id=str(provider_id),
        is_email_confirmed=True,
        is_active=True,
    )
    db.session.add(user)
    db.session.flush()  # get user.id

    profile = UserProfile(
        user_id=user.id,
        full_name=name or '',
        avatar_url=avatar_url or '',
    )
    db.session.add(profile)
    db.session.commit()
    return user


def _error_redirect(message):
    return redirect(f"{FRONTEND_URL()}/login?error={message}")


# ── Google ──────────────────────────────────────────────────────────────────

@oauth_bp.route('/api/auth/oauth/google')
def google_login():
    redirect_uri = url_for('oauth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@oauth_bp.route('/api/auth/oauth/google/callback')
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        userinfo = token.get('userinfo') or oauth.google.userinfo()
        email = userinfo.get('email')
        provider_id = userinfo.get('sub')
        name = userinfo.get('name')
        avatar = userinfo.get('picture')
        if not email or not provider_id:
            return _error_redirect('google_missing_info')
        user = _find_or_create_user(email, 'google', provider_id, name, avatar)
        return _redirect_with_tokens(user)
    except Exception:
        current_app.logger.exception("Google OAuth error")
        return _error_redirect('google_failed')


# ── Facebook ─────────────────────────────────────────────────────────────────

@oauth_bp.route('/api/auth/oauth/facebook')
def facebook_login():
    redirect_uri = url_for('oauth.facebook_callback', _external=True)
    return oauth.facebook.authorize_redirect(redirect_uri)


@oauth_bp.route('/api/auth/oauth/facebook/callback')
def facebook_callback():
    try:
        oauth.facebook.authorize_access_token()
        resp = oauth.facebook.get('me?fields=id,name,email,picture')
        profile = resp.json()
        email = profile.get('email')
        provider_id = profile.get('id')
        name = profile.get('name')
        avatar = profile.get('picture', {}).get('data', {}).get('url')
        if not provider_id:
            return _error_redirect('facebook_missing_info')
        user = _find_or_create_user(email, 'facebook', provider_id, name, avatar)
        return _redirect_with_tokens(user)
    except Exception:
        current_app.logger.exception("Facebook OAuth error")
        return _error_redirect('facebook_failed')


# ── X (Twitter) ──────────────────────────────────────────────────────────────

@oauth_bp.route('/api/auth/oauth/x')
def x_login():
    redirect_uri = url_for('oauth.x_callback', _external=True)
    return oauth.x.authorize_redirect(redirect_uri)


@oauth_bp.route('/api/auth/oauth/x/callback')
def x_callback():
    try:
        oauth.x.authorize_access_token()
        resp = oauth.x.get('users/me?user.fields=id,name,username,profile_image_url')
        data = resp.json().get('data', {})
        provider_id = data.get('id')
        name = data.get('name')
        username = data.get('username', '')
        avatar = data.get('profile_image_url')
        # X doesn't always return email — use a placeholder
        email = f"{username}@x-oauth.local" if username else None
        if not provider_id:
            return _error_redirect('x_missing_info')
        user = _find_or_create_user(email, 'x', provider_id, name, avatar)
        return _redirect_with_tokens(user)
    except Exception:
        current_app.logger.exception("X OAuth error")
        return _error_redirect('x_failed')

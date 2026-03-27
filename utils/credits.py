"""
AI credits enforcement and usage logging.

Policy:
- Free users start with 10 credits and reset to 10 every 30 days.
- Subscribed users (tier != "free" AND status == "active") are never blocked.
- Cache hits cost 0 credits for everyone.
"""
from datetime import datetime, timedelta

from flask import jsonify

from models.models import AIUsageLog, UserProfile, db

CREDITS_COST: dict[str, int] = {
    "comment": 1,
    "joke": 1,
    "viral_post": 2,
    "analysis": 3,
    "perspective": 3,
    "summary": 1,
}

_RESET_BALANCE = 10
_RESET_DAYS = 30


def _maybe_reset_credits(user) -> None:
    """Reset the user's credit balance if their reset window has passed."""
    now = datetime.utcnow()
    if user.ai_credits_reset_at is not None and now >= user.ai_credits_reset_at:
        user.ai_credits_balance = _RESET_BALANCE
        user.ai_credits_reset_at = now + timedelta(days=_RESET_DAYS)


def _is_subscribed(user) -> bool:
    profile = UserProfile.query.filter_by(user_id=user.id).first()
    return (
        profile is not None
        and profile.subscription_tier != "free"
        and profile.subscription_status == "active"
    )


def check_and_deduct_credits(user, task_type: str, cache_hit: bool):
    """
    Check, log, and deduct AI credits for a generation request.

    - If cache_hit is True: log the call with 0 credits used, no deduction.
    - If the user is subscribed: log the call with 0 credits deducted (unlimited).
    - Otherwise: deduct cost from free-tier balance; return 402 if insufficient.

    Returns:
        None on success.
        A Flask (response, 402) tuple if the user has run out of credits.
    """
    _maybe_reset_credits(user)

    cost = CREDITS_COST.get(task_type, 1)
    credits_used = 0 if cache_hit else cost

    log = AIUsageLog(
        user_id=user.id,
        task_type=task_type,
        cache_hit=cache_hit,
        credits_used=credits_used,
    )
    db.session.add(log)

    if cache_hit:
        db.session.commit()
        return None

    if _is_subscribed(user):
        db.session.commit()
        return None

    # Free user — enforce balance
    if user.ai_credits_balance < cost:
        db.session.rollback()
        return (
            jsonify({
                "message": (
                    "You have run out of AI credits. "
                    "Credits reset every 30 days or upgrade to Pro for unlimited access."
                ),
                "credits_balance": user.ai_credits_balance,
                "credits_required": cost,
                "task_type": task_type,
            }),
            402,
        )

    user.ai_credits_balance -= cost
    db.session.commit()
    return None


def get_credits_info(user) -> dict:
    """Return a dict suitable for the GET /api/user/credits response."""
    _maybe_reset_credits(user)
    profile = UserProfile.query.filter_by(user_id=user.id).first()
    db.session.commit()  # persist any reset that occurred
    return {
        "ai_credits_balance": user.ai_credits_balance,
        "ai_credits_reset_at": (
            user.ai_credits_reset_at.isoformat() if user.ai_credits_reset_at else None
        ),
        "plan": profile.subscription_tier if profile else "free",
        "subscription_status": profile.subscription_status if profile else "inactive",
    }

"""
Stripe billing routes.

Endpoints:
  POST /api/billing/create-checkout-session  — start a Stripe Checkout flow
  POST /api/billing/portal                   — open the Stripe Customer Portal
  POST /api/billing/webhook                  — receive Stripe webhook events
"""
import os
from datetime import datetime

import stripe
from flask import Blueprint, current_app, g, jsonify, request

from models.models import UserProfile, db
from utils.decorators import token_required

billing_bp = Blueprint("billing", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stripe_key() -> str:
    return current_app.config.get("STRIPE_SECRET_KEY", "")


def _get_or_create_customer(user, profile: UserProfile) -> str:
    """Return the Stripe customer ID, creating one if needed."""
    if profile.stripe_customer_id:
        return profile.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id)},
    )
    profile.stripe_customer_id = customer.id
    db.session.commit()
    return customer.id


def _price_id_for_plan(plan: str) -> str | None:
    if plan == "starter":
        return current_app.config.get("STRIPE_STARTER_PRICE_ID")
    return None


def _get(obj, key, default=None):
    """Get a value from a Stripe SDK object or plain dict safely."""
    try:
        # Attribute access (Stripe v8 SDK objects)
        val = getattr(obj, key, None)
        if val is not None:
            return val
    except Exception:
        pass
    try:
        # Dict-like access (webhook payloads / older SDK)
        return obj.get(key, default)
    except Exception:
        return default


def _sync_subscription(customer_id: str, subscription) -> None:
    """Write Stripe subscription state to UserProfile."""
    profile = UserProfile.query.filter_by(stripe_customer_id=customer_id).first()
    if not profile:
        return

    status = _get(subscription, "status", "inactive")
    cancel_at_period_end = _get(subscription, "cancel_at_period_end", False)

    if status in ("active", "trialing"):
        profile.subscription_status = "canceling" if cancel_at_period_end else "active"
    elif status in ("past_due", "unpaid"):
        profile.subscription_status = "past_due"
    elif status in ("canceled", "incomplete_expired"):
        profile.subscription_status = "inactive"
        profile.subscription_tier = "free"
        profile.stripe_subscription_id = None
        db.session.commit()
        return
    else:
        profile.subscription_status = status

    # Determine tier from price metadata, fall back to "starter"
    tier = "starter"
    try:
        sub_items = _get(subscription, "items", None)
        items_data = _get(sub_items, "data", []) if sub_items else []
        if items_data:
            price = _get(items_data[0], "price", None)
            if price:
                metadata = _get(price, "metadata", None) or {}
                tier = (metadata.get("tier") if hasattr(metadata, "get") else None) or "starter"
    except Exception:
        tier = "starter"

    profile.subscription_tier = tier
    profile.stripe_subscription_id = _get(subscription, "id")

    period_end = _get(subscription, "current_period_end")
    if period_end:
        profile.subscription_expires_at = datetime.utcfromtimestamp(int(period_end))

    db.session.commit()


def _tier_from_amount(price: dict) -> str:
    """Fall back to inferring tier from price amount (cents)."""
    return "starter"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@billing_bp.route("/api/billing/create-checkout-session", methods=["POST"])
@token_required
def create_checkout_session():
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"message": "Payments are not configured on this server."}), 503

    data = request.get_json(silent=True) or {}
    plan = data.get("plan")  # "starter"
    price_id = _price_id_for_plan(plan)

    if not price_id:
        return jsonify({"message": f"Unknown or unconfigured plan: '{plan}'"}), 400

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=g.current_user.id)
        db.session.add(profile)
        db.session.commit()

    # If user already has an active subscription, send them to the portal instead
    if profile.subscription_status == "active" and profile.stripe_customer_id:
        return jsonify({"message": "Already subscribed. Use the portal to manage your plan."}), 409

    customer_id = _get_or_create_customer(g.current_user, profile)
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{frontend_url}/billing/cancel",
        metadata={"user_id": str(g.current_user.id)},
    )

    return jsonify({"url": session.url}), 200


@billing_bp.route("/api/billing/portal", methods=["POST"])
@token_required
def create_portal_session():
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"message": "Payments are not configured on this server."}), 503

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile or not profile.stripe_customer_id:
        return jsonify({"message": "No billing account found."}), 404

    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    portal = stripe.billing_portal.Session.create(
        customer=profile.stripe_customer_id,
        return_url=f"{frontend_url}/settings",
    )

    return jsonify({"url": portal.url}), 200


@billing_bp.route("/api/billing/payment-history", methods=["GET"])
@token_required
def payment_history():
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"payments": []}), 200

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile or not profile.stripe_customer_id:
        return jsonify({"payments": []}), 200

    try:
        invoices = stripe.Invoice.list(
            customer=profile.stripe_customer_id,
            limit=24,
            expand=["data.subscription"],
        )
        payments = [
            {
                "id": inv.id,
                "date": inv.created,
                "amount": inv.amount_paid / 100,
                "currency": inv.currency.upper(),
                "status": inv.status,
                "description": inv.lines.data[0].description if inv.lines.data else "Subscription",
                "invoice_url": inv.hosted_invoice_url,
                "invoice_pdf": inv.invoice_pdf,
            }
            for inv in invoices.auto_paging_iter()
        ]
        return jsonify({"payments": payments}), 200
    except stripe.error.StripeError as exc:
        return jsonify({"message": str(exc)}), 502


@billing_bp.route("/api/billing/cancel", methods=["POST"])
@token_required
def cancel_subscription():
    """
    Schedule the subscription to cancel at the end of the current billing period.
    The user keeps access until then; the webhook downgrades them when it expires.
    """
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"message": "Payments are not configured."}), 503

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile or not profile.stripe_subscription_id:
        return jsonify({"message": "No active subscription found."}), 404

    try:
        stripe.Subscription.modify(
            profile.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        profile.subscription_status = "canceling"
        db.session.commit()
        return jsonify({"canceled": True}), 200
    except stripe.error.StripeError as exc:
        return jsonify({"message": str(exc)}), 502


@billing_bp.route("/api/billing/resume", methods=["POST"])
@token_required
def resume_subscription():
    """Re-enable auto-renewal for a subscription that was set to cancel at period end."""
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"message": "Payments are not configured."}), 503

    profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile or not profile.stripe_subscription_id:
        return jsonify({"message": "No subscription found."}), 404

    try:
        stripe.Subscription.modify(
            profile.stripe_subscription_id,
            cancel_at_period_end=False,
        )
        profile.subscription_status = "active"
        db.session.commit()
        return jsonify({"resumed": True}), 200
    except stripe.error.StripeError as exc:
        return jsonify({"message": str(exc)}), 502


@billing_bp.route("/api/billing/sync-subscription", methods=["POST"])
@token_required
def sync_subscription():
    """
    Pull the live subscription state from Stripe and write it to the local DB.
    Called from the settings page when the user's plan looks out of sync.
    """
    try:
        stripe.api_key = _stripe_key()
        if not stripe.api_key:
            return jsonify({"message": "Payments are not configured."}), 503

        profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
        if not profile or not profile.stripe_customer_id:
            return jsonify({"synced": False, "reason": "no_customer"}), 200

        subscriptions = stripe.Subscription.list(
            customer=profile.stripe_customer_id,
            limit=5,
        )
        active = next(
            (s for s in subscriptions.auto_paging_iter()
             if s["status"] in ("active", "trialing", "past_due")),
            None,
        )

        if not active:
            if profile.subscription_tier != "free" or profile.subscription_status == "active":
                profile.subscription_tier = "free"
                profile.subscription_status = "inactive"
                profile.stripe_subscription_id = None
                profile.subscription_expires_at = None
                db.session.commit()
            return jsonify({"synced": True, "tier": "free", "status": "inactive"}), 200

        _sync_subscription(profile.stripe_customer_id, active)

        profile = UserProfile.query.filter_by(user_id=g.current_user.id).first()
        return jsonify({
            "synced": True,
            "tier": profile.subscription_tier,
            "status": profile.subscription_status,
        }), 200

    except stripe.error.StripeError as exc:
        db.session.rollback()
        return jsonify({"message": str(exc)}), 502
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("sync_subscription error")
        # Temporary: expose error detail for debugging — remove before production
        return jsonify({"message": f"[DEBUG] {type(exc).__name__}: {exc}"}), 500


@billing_bp.route("/api/billing/sync-checkout", methods=["POST"])
@token_required
def sync_checkout():
    """
    Called by the success page to immediately confirm and sync a completed
    checkout session without waiting for a webhook delivery.
    """
    stripe.api_key = _stripe_key()
    if not stripe.api_key:
        return jsonify({"message": "Payments are not configured."}), 503

    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"message": "session_id is required."}), 400

    try:
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=["subscription"],
        )
        # Verify ownership
        if str(session.get("metadata", {}).get("user_id")) != str(g.current_user.id):
            return jsonify({"message": "Session does not belong to this user."}), 403

        if session.get("payment_status") != "paid":
            return jsonify({"synced": False, "reason": "payment not completed"}), 200

        subscription = session.get("subscription")
        customer_id = session.get("customer")
        if subscription and customer_id:
            if isinstance(subscription, str):
                subscription = stripe.Subscription.retrieve(subscription)
            _sync_subscription(customer_id, subscription)

        return jsonify({"synced": True}), 200
    except stripe.error.StripeError as exc:
        return jsonify({"message": str(exc)}), 502


@billing_bp.route("/api/billing/webhook", methods=["POST"])
def stripe_webhook():
    stripe.api_key = _stripe_key()
    webhook_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET", "")

    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # Dev mode — no signature verification
            import json
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        return jsonify({"message": str(exc)}), 400

    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "checkout.session.completed":
        sub_id = obj.get("subscription")
        customer_id = obj.get("customer")
        if sub_id and customer_id:
            sub = stripe.Subscription.retrieve(sub_id)
            _sync_subscription(customer_id, sub)

    elif etype in ("customer.subscription.updated", "customer.subscription.created"):
        _sync_subscription(obj.get("customer"), obj)

    elif etype == "customer.subscription.deleted":
        customer_id = obj.get("customer")
        profile = UserProfile.query.filter_by(stripe_customer_id=customer_id).first()
        if profile:
            profile.subscription_tier = "free"
            profile.subscription_status = "inactive"
            profile.subscription_expires_at = None
            profile.stripe_subscription_id = None
            db.session.commit()

    elif etype == "invoice.payment_failed":
        customer_id = obj.get("customer")
        profile = UserProfile.query.filter_by(stripe_customer_id=customer_id).first()
        if profile:
            profile.subscription_status = "past_due"
            db.session.commit()

    return jsonify({"received": True}), 200

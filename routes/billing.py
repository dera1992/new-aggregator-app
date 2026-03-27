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


def _sync_subscription(customer_id: str, subscription: dict) -> None:
    """Write Stripe subscription state to UserProfile."""
    profile = UserProfile.query.filter_by(stripe_customer_id=customer_id).first()
    if not profile:
        return

    status = subscription.get("status", "inactive")
    if status in ("active", "trialing"):
        profile.subscription_status = "active"
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

    # Determine tier from the price amount or its metadata
    items = subscription.get("items", {}).get("data", [])
    tier = "pro"
    if items:
        price = items[0].get("price", {})
        tier = price.get("metadata", {}).get("tier") or _tier_from_amount(price)

    profile.subscription_tier = tier
    profile.stripe_subscription_id = subscription.get("id")

    period_end = subscription.get("current_period_end")
    if period_end:
        profile.subscription_expires_at = datetime.utcfromtimestamp(period_end)

    db.session.commit()


def _tier_from_amount(price: dict) -> str:
    """Fall back to inferring tier from price amount (cents)."""
    amount = price.get("unit_amount", 0)
    return "business" if amount >= 9900 else "pro"


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
    plan = data.get("plan")  # "pro" | "business"
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

from datetime import datetime
from types import SimpleNamespace

from tests.conftest import auth_headers, create_user


def test_billing_checkout_portal_payment_history_and_subscription_sync(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    UserProfile = models.UserProfile

    user_id = create_user(app_ctx, email="billing@example.com")
    headers = auth_headers(app, user_id)

    with app.app_context():
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()

    billing_module = __import__("routes.billing", fromlist=["stripe"])
    app.config["STRIPE_SECRET_KEY"] = "sk_test_123"
    app.config["STRIPE_STARTER_PRICE_ID"] = "price_starter"

    monkeypatch.setattr(billing_module.stripe.Customer, "create", lambda **_kwargs: SimpleNamespace(id="cus_123"))
    monkeypatch.setattr(
        billing_module.stripe.checkout.Session,
        "create",
        lambda **_kwargs: SimpleNamespace(url="https://stripe.test/checkout"),
    )
    monkeypatch.setattr(
        billing_module.stripe.billing_portal.Session,
        "create",
        lambda **_kwargs: SimpleNamespace(url="https://stripe.test/portal"),
    )

    class FakeInvoice:
        def __init__(self):
            self.id = "in_123"
            self.created = 1710000000
            self.amount_paid = 900
            self.currency = "usd"
            self.status = "paid"
            self.lines = SimpleNamespace(data=[SimpleNamespace(description="Starter Plan")])
            self.hosted_invoice_url = "https://stripe.test/invoice"
            self.invoice_pdf = "https://stripe.test/invoice.pdf"

    monkeypatch.setattr(
        billing_module.stripe.Invoice,
        "list",
        lambda **_kwargs: SimpleNamespace(auto_paging_iter=lambda: iter([FakeInvoice()])),
    )
    monkeypatch.setattr(
        billing_module.stripe.Subscription,
        "modify",
        lambda *_args, **_kwargs: SimpleNamespace(),
    )
    monkeypatch.setattr(
        billing_module.stripe.Subscription,
        "list",
        lambda **_kwargs: SimpleNamespace(
            auto_paging_iter=lambda: iter([
                {
                    "id": "sub_123",
                    "status": "active",
                    "customer": "cus_123",
                    "cancel_at_period_end": False,
                    "current_period_end": int(datetime(2026, 4, 1).timestamp()),
                    "items": {"data": [{"price": {"metadata": {"tier": "starter"}}}]},
                }
            ])
        ),
    )
    monkeypatch.setattr(
        billing_module.stripe.checkout.Session,
        "retrieve",
        lambda *_args, **_kwargs: {
            "metadata": {"user_id": str(user_id)},
            "payment_status": "paid",
            "customer": "cus_123",
            "subscription": {
                "id": "sub_123",
                "status": "active",
                "customer": "cus_123",
                "cancel_at_period_end": False,
                "current_period_end": int(datetime(2026, 4, 1).timestamp()),
                "items": {"data": [{"price": {"metadata": {"tier": "starter"}}}]},
            },
        },
    )

    checkout = client.post("/api/billing/create-checkout-session", json={"plan": "starter"}, headers=headers)
    assert checkout.status_code == 200
    assert checkout.get_json()["url"] == "https://stripe.test/checkout"

    with app.app_context():
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        profile.subscription_status = "active"
        profile.stripe_customer_id = "cus_123"
        profile.stripe_subscription_id = "sub_123"
        db.session.commit()

    portal = client.post("/api/billing/portal", headers=headers)
    assert portal.status_code == 200
    assert portal.get_json()["url"] == "https://stripe.test/portal"

    history = client.get("/api/billing/payment-history", headers=headers)
    assert history.status_code == 200
    assert history.get_json()["payments"][0]["amount"] == 9

    cancel = client.post("/api/billing/cancel", headers=headers)
    assert cancel.status_code == 200
    resume = client.post("/api/billing/resume", headers=headers)
    assert resume.status_code == 200

    synced = client.post("/api/billing/sync-subscription", headers=headers)
    assert synced.status_code == 200
    assert synced.get_json()["tier"] == "starter"

    sync_checkout = client.post(
        "/api/billing/sync-checkout",
        json={"session_id": "cs_123"},
        headers=headers,
    )
    assert sync_checkout.status_code == 200
    assert sync_checkout.get_json()["synced"] is True


def test_billing_webhook_updates_profile_and_handles_payment_failure(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    UserProfile = models.UserProfile

    user_id = create_user(app_ctx, email="webhook@example.com")
    with app.app_context():
        profile = UserProfile(
            user_id=user_id,
            stripe_customer_id="cus_webhook",
            stripe_subscription_id="sub_old",
            subscription_tier="starter",
            subscription_status="active",
        )
        db.session.add(profile)
        db.session.commit()

    billing_module = __import__("routes.billing", fromlist=["stripe"])
    app.config["STRIPE_SECRET_KEY"] = "sk_test_123"
    monkeypatch.setattr(
        billing_module.stripe.Webhook,
        "construct_event",
        lambda payload, *_args: {
            "type": "customer.subscription.deleted",
            "data": {"object": {"customer": "cus_webhook"}},
        },
    )

    deleted = client.post(
        "/api/billing/webhook",
        data=b"{}",
        headers={"Stripe-Signature": "sig", "Origin": "http://frontend.test"},
    )
    assert deleted.status_code == 200

    with app.app_context():
        profile = UserProfile.query.filter_by(stripe_customer_id="cus_webhook").first()
        assert profile.subscription_status == "inactive"
        assert profile.subscription_tier == "free"

    monkeypatch.setattr(
        billing_module.stripe.Webhook,
        "construct_event",
        lambda payload, *_args: {
            "type": "invoice.payment_failed",
            "data": {"object": {"customer": "cus_webhook"}},
        },
    )
    failed = client.post(
        "/api/billing/webhook",
        data=b"{}",
        headers={"Stripe-Signature": "sig", "Origin": "http://frontend.test"},
    )
    assert failed.status_code == 200

    with app.app_context():
        profile = UserProfile.query.filter_by(stripe_customer_id="cus_webhook").first()
        assert profile.subscription_status == "past_due"


def test_oauth_callbacks_and_user_linking(app_ctx, client, monkeypatch):
    app = app_ctx["app"]
    db = app_ctx["db"]
    models = app_ctx["models"]
    User = models.User
    UserProfile = models.UserProfile

    existing_user_id = create_user(app_ctx, email="oauth@example.com", confirmed=False)
    oauth_module = __import__("routes.oauth", fromlist=["oauth"])

    google_provider = SimpleNamespace(
        authorize_redirect=lambda uri: app.response_class(status=302, headers={"Location": uri}),
        authorize_access_token=lambda: {
            "userinfo": {
                "email": "oauth@example.com",
                "sub": "google-123",
                "name": "OAuth User",
                "picture": "https://img.test/google.png",
            }
        },
    )
    facebook_provider = SimpleNamespace(
        authorize_redirect=lambda uri: app.response_class(status=302, headers={"Location": uri}),
        authorize_access_token=lambda: {"access_token": "facebook-token"},
        get=lambda _path: SimpleNamespace(
            json=lambda: {
                "id": "facebook-123",
                "email": "facebook@example.com",
                "name": "Facebook User",
                "picture": {"data": {"url": "https://img.test/facebook.png"}},
            }
        ),
    )
    x_provider = SimpleNamespace(
        authorize_redirect=lambda uri: app.response_class(status=302, headers={"Location": uri}),
        authorize_access_token=lambda: {"access_token": "x-token"},
        get=lambda _path: SimpleNamespace(
            json=lambda: {
                "data": {
                    "id": "x-123",
                    "name": "X User",
                    "username": "xuser",
                    "profile_image_url": "https://img.test/x.png",
                }
            }
        ),
    )

    monkeypatch.setattr(oauth_module.oauth, "google", google_provider)
    monkeypatch.setattr(oauth_module.oauth, "facebook", facebook_provider)
    monkeypatch.setattr(oauth_module.oauth, "x", x_provider)

    google_login = client.get("/api/auth/oauth/google")
    assert google_login.status_code == 302

    google_callback = client.get("/api/auth/oauth/google/callback")
    assert google_callback.status_code == 302
    assert google_callback.headers["Location"].startswith("http://frontend.test/callback?token=")

    with app.app_context():
        existing = db.session.get(User, existing_user_id)
        assert existing.oauth_provider == "google"
        assert existing.oauth_provider_id == "google-123"
        assert existing.is_email_confirmed is True

    facebook_callback = client.get("/api/auth/oauth/facebook/callback")
    assert facebook_callback.status_code == 302

    x_callback = client.get("/api/auth/oauth/x/callback")
    assert x_callback.status_code == 302

    with app.app_context():
        facebook_user = User.query.filter_by(email="facebook@example.com").first()
        x_user = User.query.filter_by(oauth_provider="x", oauth_provider_id="x-123").first()
        assert facebook_user is not None
        assert x_user is not None
        assert UserProfile.query.filter_by(user_id=facebook_user.id).first() is not None
        assert UserProfile.query.filter_by(user_id=x_user.id).first() is not None

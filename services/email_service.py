import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@ubevera.com")
FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "Ubevera")


# ---------------------------------------------------------------------------
# HTML templates
# ---------------------------------------------------------------------------

def _base_template(title: str, body_html: str) -> str:
    return (
        '<!DOCTYPE html><html lang="en"><head>'
        '<meta charset="UTF-8"/>'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>'
        f'<title>{title}</title></head>'
        '<body style="margin:0;padding:0;background:#0a0a0a;font-family:\'Helvetica Neue\',Arial,sans-serif;">'
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">'
        '<tr><td align="center">'
        '<table width="560" cellpadding="0" cellspacing="0" '
        'style="max-width:560px;width:100%;background:#111111;border-radius:12px;overflow:hidden;border:1px solid #222;">'
        '<tr><td style="padding:32px 40px 24px;border-bottom:1px solid #222;">'
        '<span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Ubevera</span>'
        '</td></tr>'
        f'<tr><td style="padding:36px 40px;">{body_html}</td></tr>'
        '<tr><td style="padding:20px 40px 28px;border-top:1px solid #222;">'
        '<p style="margin:0;font-size:12px;color:#555;line-height:1.6;">'
        'You received this email because an action was taken on your Ubevera account. '
        'If you did not request this, you can safely ignore it.'
        '</p></td></tr>'
        '</table></td></tr></table>'
        '</body></html>'
    )


def _button(label: str, url: str) -> str:
    return (
        f'<a href="{url}" target="_blank" '
        'style="display:inline-block;margin-top:24px;padding:13px 28px;'
        'background:#ffffff;color:#000000;font-size:14px;font-weight:600;'
        f'text-decoration:none;border-radius:8px;">{label}</a>'
    )


def _confirmation_html(link: str) -> str:
    body = (
        '<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Confirm your email</h2>'
        '<p style="margin:0;font-size:15px;color:#999;line-height:1.7;">'
        'Welcome to Ubevera! Click the button below to verify your email address and activate your account.'
        '</p>'
        + _button("Confirm my account", link)
        + '<p style="margin:20px 0 0;font-size:13px;color:#555;">'
        'This link expires in 24 hours. If the button does not work, copy and paste this URL:<br/>'
        f'<a href="{link}" style="color:#888;word-break:break-all;">{link}</a></p>'
    )
    return _base_template("Confirm your Ubevera account", body)


def _reset_password_html(link: str) -> str:
    body = (
        '<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Reset your password</h2>'
        '<p style="margin:0;font-size:15px;color:#999;line-height:1.7;">'
        'We received a request to reset the password for your Ubevera account. '
        'Click the button below to choose a new password.'
        '</p>'
        + _button("Reset my password", link)
        + '<p style="margin:20px 0 0;font-size:13px;color:#555;">'
        'This link expires in 2 hours. If you did not request a reset, ignore this email — '
        'your password will not change.<br/><br/>'
        'If the button does not work, copy and paste this URL:<br/>'
        f'<a href="{link}" style="color:#888;word-break:break-all;">{link}</a></p>'
    )
    return _base_template("Reset your Ubevera password", body)


# ---------------------------------------------------------------------------
# Core send function
# ---------------------------------------------------------------------------

def send_email(to_email: str, subject: str, body: str, html: str | None = None) -> None:
    """Send an email via SendGrid. Falls back to console when SENDGRID_API_KEY is not set."""
    if not SENDGRID_API_KEY:
        logger.info("[email] SENDGRID_API_KEY not set — printing to console instead.")
        print(f"\n[email] To: {to_email}\nSubject: {subject}\n\n{body}\n")
        return

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content

        message = Mail()
        message.from_email = Email(FROM_EMAIL, FROM_NAME)
        message.to = [To(to_email)]
        message.subject = subject
        message.add_content(Content("text/plain", body))
        if html:
            message.add_content(Content("text/html", html))

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info("[email] Sent to %s — status %s", to_email, response.status_code)
    except Exception as exc:
        logger.error("[email] Failed to send to %s: %s", to_email, exc)


# ---------------------------------------------------------------------------
# Typed helpers called from auth routes and services
# ---------------------------------------------------------------------------

def send_confirmation_email(to_email: str, confirmation_link: str) -> None:
    send_email(
        to_email=to_email,
        subject="Confirm your Ubevera account",
        body=(
            "Welcome to Ubevera!\n\n"
            f"Click the link below to confirm your email address:\n{confirmation_link}\n\n"
            "This link expires in 24 hours."
        ),
        html=_confirmation_html(confirmation_link),
    )


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    send_email(
        to_email=to_email,
        subject="Reset your Ubevera password",
        body=(
            "You requested a password reset for your Ubevera account.\n\n"
            f"Click the link below to set a new password:\n{reset_link}\n\n"
            "This link expires in 2 hours. If you did not request this, ignore this email."
        ),
        html=_reset_password_html(reset_link),
    )


def send_digest_email(to_email: str, stories: list[dict]) -> None:
    """Send a daily digest email with a list of story dicts (title, summary, sources)."""
    plain_lines = ["Here is your daily news digest from Ubevera:\n"]
    html_stories = ""

    for story in stories:
        title = story.get("title", "Untitled")
        summary = story.get("summary") or ""
        sources = ", ".join(sorted(set(story.get("sources", []))))

        plain_lines.append(f"- {title}\n  {summary}\n  Sources: {sources}\n")
        html_stories += (
            '<tr><td style="padding:16px 0;border-bottom:1px solid #1e1e1e;">'
            f'<p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#ffffff;">{title}</p>'
            f'<p style="margin:0 0 6px;font-size:14px;color:#999;line-height:1.6;">{summary}</p>'
            f'<p style="margin:0;font-size:12px;color:#555;">Sources: {sources}</p>'
            '</td></tr>'
        )

    body_html = (
        '<h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#ffffff;">Your daily digest</h2>'
        '<p style="margin:0 0 24px;font-size:14px;color:#666;">Top stories from the last 24 hours</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0">{html_stories}</table>'
        '<p style="margin:24px 0 0;font-size:13px;color:#555;">'
        'You can update your digest preferences in your Ubevera account settings.'
        '</p>'
    )

    send_email(
        to_email=to_email,
        subject="Your Daily News Digest — Ubevera",
        body="\n".join(plain_lines),
        html=_base_template("Your Daily News Digest", body_html),
    )

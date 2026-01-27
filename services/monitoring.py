"""Monitoring helpers for APScheduler job runs, failures, and alerting."""

import logging
import os
import time
from typing import Optional

from services.email_service import send_email
from utils.redis_client import get_redis_client

LOGGER = logging.getLogger(__name__)
_LOCAL_ALERT_CACHE: dict[str, float] = {}


def _set_metric(key: str, value: str) -> None:
    redis_client = get_redis_client()
    if not redis_client:
        return
    redis_client.set(key, value)


def _get_last_alert_ts(job_id: str) -> Optional[float]:
    redis_client = get_redis_client()
    if redis_client:
        ts = redis_client.get(f"monitoring:job:{job_id}:last_alert")
        return float(ts) if ts else None
    return _LOCAL_ALERT_CACHE.get(job_id)


def _set_last_alert_ts(job_id: str, ts: float) -> None:
    redis_client = get_redis_client()
    if redis_client:
        redis_client.set(f"monitoring:job:{job_id}:last_alert", str(ts))
    else:
        _LOCAL_ALERT_CACHE[job_id] = ts


def record_job_run(job_id: str) -> None:
    timestamp = str(int(time.time()))
    _set_metric(f"monitoring:job:{job_id}:last_run", timestamp)


def record_job_success(job_id: str) -> None:
    timestamp = str(int(time.time()))
    _set_metric(f"monitoring:job:{job_id}:last_success", timestamp)


def record_job_failure(job_id: str, error_message: str) -> None:
    timestamp = str(int(time.time()))
    _set_metric(f"monitoring:job:{job_id}:last_failure", timestamp)
    _set_metric(f"monitoring:job:{job_id}:last_error", error_message)


def record_job_missed(job_id: str) -> None:
    timestamp = str(int(time.time()))
    _set_metric(f"monitoring:job:{job_id}:last_missed", timestamp)


def send_alert(job_id: str, summary: str, details: Optional[str] = None) -> None:
    # Alerts are sent via the email service; set ALERT_EMAIL_TO and optionally
    # ALERT_THROTTLE_SECONDS to control recipient and throttling behavior.
    alert_email = os.getenv("ALERT_EMAIL_TO")
    if not alert_email:
        LOGGER.warning(
            "Alert not sent for %s because ALERT_EMAIL_TO is not set. Summary: %s",
            job_id,
            summary,
        )
        return

    throttle_seconds = int(os.getenv("ALERT_THROTTLE_SECONDS", "1800"))
    now = time.time()
    last_alert = _get_last_alert_ts(job_id)
    if last_alert and (now - last_alert) < throttle_seconds:
        LOGGER.info(
            "Alert for %s suppressed due to throttle window (%s seconds).",
            job_id,
            throttle_seconds,
        )
        return

    body_lines = [
        f"Job: {job_id}",
        f"Summary: {summary}",
    ]
    if details:
        body_lines.append("")
        body_lines.append(details)

    send_email(
        to_email=alert_email,
        subject=f"[Aggregator] Job alert: {job_id}",
        body="\n".join(body_lines),
    )
    _set_last_alert_ts(job_id, now)

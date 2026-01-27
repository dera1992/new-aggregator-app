import importlib
import sys
from pathlib import Path


class FakeRedis:
    def __init__(self):
        self.storage = {}

    def set(self, key, value, nx=False, ex=None):
        if nx and key in self.storage:
            return False
        self.storage[key] = value
        return True

    def get(self, key):
        return self.storage.get(key)


def test_monitoring_records_and_alerts(monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    monitoring = importlib.import_module("services.monitoring")

    fake_redis = FakeRedis()
    monkeypatch.setattr(monitoring, "get_redis_client", lambda: fake_redis)

    sent = {}

    def fake_send_email(to_email, subject, body):
        sent["to_email"] = to_email
        sent["subject"] = subject
        sent["body"] = body

    monkeypatch.setattr(monitoring, "send_email", fake_send_email)
    monkeypatch.setenv("ALERT_EMAIL_TO", "alerts@example.com")

    monitoring.record_job_run("job-a")
    monitoring.record_job_success("job-a")
    monitoring.record_job_failure("job-a", "boom")
    monitoring.record_job_missed("job-a")

    assert fake_redis.get("monitoring:job:job-a:last_run") is not None
    assert fake_redis.get("monitoring:job:job-a:last_success") is not None
    assert fake_redis.get("monitoring:job:job-a:last_failure") is not None
    assert fake_redis.get("monitoring:job:job-a:last_error") == "boom"
    assert fake_redis.get("monitoring:job:job-a:last_missed") is not None

    monitoring.send_alert("job-a", "failed", "traceback")
    assert sent["to_email"] == "alerts@example.com"
    assert "job-a" in sent["subject"]
    assert "traceback" in sent["body"]


def test_monitoring_alert_throttled(monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    monitoring = importlib.import_module("services.monitoring")

    fake_redis = FakeRedis()
    monkeypatch.setattr(monitoring, "get_redis_client", lambda: fake_redis)
    monkeypatch.setenv("ALERT_EMAIL_TO", "alerts@example.com")
    monkeypatch.setenv("ALERT_THROTTLE_SECONDS", "60")

    calls = []

    def fake_send_email(to_email, subject, body):
        calls.append((to_email, subject, body))

    monkeypatch.setattr(monitoring, "send_email", fake_send_email)

    monkeypatch.setattr(monitoring.time, "time", lambda: 1000.0)
    monitoring.send_alert("job-b", "failed")

    monkeypatch.setattr(monitoring.time, "time", lambda: 1005.0)
    monitoring.send_alert("job-b", "failed again")

    assert len(calls) == 1

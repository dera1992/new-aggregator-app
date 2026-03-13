from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED, EVENT_JOB_MISSED
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

from services.clustering_engine import cluster_recent_articles
from services.scraper import run_harvester, run_trending_harvester
from services.ai_engine import process_unsummarized_news
from services.digest_service import send_daily_digests
from services.monitoring import (
    record_job_failure,
    record_job_missed,
    record_job_run,
    record_job_success,
    send_alert,
)
from utils.redis_client import get_redis_client
import uuid

def start_background_jobs(app):
    scheduler = BackgroundScheduler()

    def run_with_context(func, job_id, lock_key, lock_timeout):
        redis_client = get_redis_client()
        lock_value = None
        if redis_client:
            lock_value = str(uuid.uuid4())
            acquired = redis_client.set(lock_key, lock_value, nx=True, ex=lock_timeout)
            if not acquired:
                return
        with app.app_context():
            try:
                record_job_run(job_id)
                func()
            finally:
                if redis_client and lock_value:
                    current_value = redis_client.get(lock_key)
                    if current_value == lock_value:
                        redis_client.delete(lock_key)

    def handle_job_event(event):
        job_id = event.job_id
        if event.code == EVENT_JOB_EXECUTED:
            record_job_success(job_id)
            return
        if event.code == EVENT_JOB_ERROR:
            error_message = str(event.exception) if event.exception else "Unknown error"
            record_job_failure(job_id, error_message)
            send_alert(job_id, error_message, event.traceback)
            return
        if event.code == EVENT_JOB_MISSED:
            record_job_missed(job_id)
            send_alert(job_id, "Job execution missed.")

    scheduler.add_listener(handle_job_event, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR | EVENT_JOB_MISSED)

    # Step 1: Scrape Raw Data (Every 20m, run immediately on startup)
    scheduler.add_job(
        id="scrape_raw_data",
        name="Scrape raw data",
        func=lambda: run_with_context(run_harvester, "scrape_raw_data", "locks:scraper", 15 * 60),
        trigger="interval",
        minutes=20,
        next_run_time=datetime.now(),
    )

    # Step 2: Generate AI Summaries (Every 22m, run 2m after startup to let scrape finish)
    scheduler.add_job(
        id="generate_ai_summaries",
        name="Generate AI summaries",
        func=lambda: run_with_context(
            process_unsummarized_news,
            "generate_ai_summaries",
            "locks:ai_summaries",
            20 * 60,
        ),
        trigger="interval",
        minutes=22,
        next_run_time=datetime.now(),
    )

    # Step 3: Group into Clusters (Every 25m, first run 5m after startup
    # to let the scraper + summarizer finish their initial pass first)
    scheduler.add_job(
        id="cluster_recent_articles",
        name="Cluster recent articles",
        func=lambda: run_with_context(
            cluster_recent_articles,
            "cluster_recent_articles",
            "locks:cluster",
            20 * 60,
        ),
        trigger="interval",
        minutes=25,
        next_run_time=datetime.now() + timedelta(minutes=5),
    )

    # Step 4: Scrape trending news from Google Trends (Every 30m, first run 3m after startup)
    scheduler.add_job(
        id="scrape_trending_news",
        name="Scrape trending news",
        func=lambda: run_with_context(run_trending_harvester, "scrape_trending_news", "locks:trending", 25 * 60),
        trigger="interval",
        minutes=30,
        next_run_time=datetime.now() + timedelta(minutes=3),
    )

    # Step 5: Send daily digests (Every 15m)
    scheduler.add_job(
        id="send_daily_digests",
        name="Send daily digests",
        func=lambda: run_with_context(
            send_daily_digests,
            "send_daily_digests",
            "locks:daily_digest",
            10 * 60,
        ),
        trigger="interval",
        minutes=15,
        next_run_time=datetime.now(),
    )

    scheduler.start()

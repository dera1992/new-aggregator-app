from apscheduler.schedulers.background import BackgroundScheduler

from services.clustering_engine import cluster_recent_articles
from services.scraper import run_harvester
from services.ai_engine import process_unsummarized_news
from utils.redis_client import get_redis_client
import uuid

def start_background_jobs(app):
    scheduler = BackgroundScheduler()

    def run_with_context(func, lock_key, lock_timeout):
        redis_client = get_redis_client()
        lock_value = None
        if redis_client:
            lock_value = str(uuid.uuid4())
            acquired = redis_client.set(lock_key, lock_value, nx=True, ex=lock_timeout)
            if not acquired:
                return
        with app.app_context():
            try:
                func()
            finally:
                if redis_client and lock_value:
                    current_value = redis_client.get(lock_key)
                    if current_value == lock_value:
                        redis_client.delete(lock_key)

    # Step 1: Scrape Raw Data (Every 20m)
    scheduler.add_job(
        func=lambda: run_with_context(run_harvester, "locks:scraper", 15 * 60),
        trigger="interval", minutes=20
    )

    # Step 2: Generate AI Summaries (Every 22m)
    scheduler.add_job(
        func=lambda: run_with_context(process_unsummarized_news, "locks:ai_summaries", 20 * 60),
        trigger="interval", minutes=22
    )

    # Step 3: Group into Clusters (Every 25m)
    scheduler.add_job(
        func=lambda: run_with_context(cluster_recent_articles, "locks:cluster", 20 * 60),
        trigger="interval", minutes=25
    )

    scheduler.start()

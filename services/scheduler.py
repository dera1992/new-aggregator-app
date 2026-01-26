from apscheduler.schedulers.background import BackgroundScheduler

from services.clustering_engine import cluster_recent_articles
from services.scraper import run_harvester
from services.ai_engine import process_unsummarized_news

def start_background_jobs(app):
    scheduler = BackgroundScheduler()

    def run_with_context(func):
        with app.app_context():
            func()

    # Step 1: Scrape Raw Data (Every 20m)
    scheduler.add_job(
        func=lambda: run_with_context(run_harvester),
        trigger="interval", minutes=20
    )

    # Step 2: Generate AI Summaries (Every 22m)
    scheduler.add_job(
        func=lambda: run_with_context(process_unsummarized_news),
        trigger="interval", minutes=22
    )

    # Step 3: Group into Clusters (Every 25m)
    scheduler.add_job(
        func=lambda: run_with_context(cluster_recent_articles),
        trigger="interval", minutes=25
    )

    scheduler.start()

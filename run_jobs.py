import os
from app import create_app

# Only run if enabled (worker sets it true)
if os.getenv("RUN_BACKGROUND_JOBS", "true").lower() != "true":
    print("RUN_BACKGROUND_JOBS is false. Exiting worker.")
    raise SystemExit(0)

app = create_app()

with app.app_context():
    from services.scheduler import start_background_jobs
    start_background_jobs(app)
    print("✅ Background jobs started")

    # Keep process alive if your scheduler runs in background threads
    # (APScheduler usually does). If your scheduler blocks itself, remove this.
    import time
    while True:
        time.sleep(60)

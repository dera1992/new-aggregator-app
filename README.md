# News Aggregator App

A Flask-based news aggregation service that scrapes sources, summarizes articles with AI, clusters related stories, and delivers digests. It provides REST endpoints for authentication, news retrieval, and user preferences while running background jobs for data processing. The application uses PostgreSQL for persistence and optional Redis locks for scheduler coordination.

## Features

- **API endpoints** for auth, news, and preferences via Flask blueprints.
- **Background processing** using APScheduler to run scraping, summarization, clustering, and digest delivery.
- **PostgreSQL storage** through SQLAlchemy.
- **Optional Redis locking** to prevent duplicate job execution in multi-instance deployments.

## Architecture Overview

- `app.py` boots the Flask app, registers routes, initializes the database, and optionally starts background jobs.
- `services/` contains the scraper, AI summarization, clustering, digest delivery, and scheduler logic.
- `models/` defines SQLAlchemy models for persisted data.
- `routes/` exposes HTTP endpoints for authentication, news, and preferences.
- `utils/` provides helpers like the Redis client.

## Running the Application

### Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

The API will be available at http://localhost:8080. Environment variables are configured in `docker-compose.yml`, including the PostgreSQL and Redis services.

### Local Development

1. **Install dependencies**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/news_db"
   export SECRET_KEY="change-me"
   export RUN_BACKGROUND_JOBS="true"
   export REDIS_URL="redis://localhost:6379/0"
   ```

3. **Start the server**
   ```bash
   python app.py
   ```
   The server runs on port `8080`.

## Scheduler Details

Background jobs are started during app initialization when `RUN_BACKGROUND_JOBS` is not set to `false`. The scheduler is an APScheduler `BackgroundScheduler` configured to:

- **Scrape raw data** every 20 minutes.
- **Generate AI summaries** every 22 minutes.
- **Cluster recent articles** every 25 minutes.
- **Send daily digests** every 15 minutes.

If `REDIS_URL` is configured, each job acquires a Redis lock before running to avoid duplicate processing across multiple app instances.

## Testing

Run the test suite with:

```bash
pytest
```

## Frontend (Next.js)

The production-ready Next.js frontend lives inside this Flask repo at `frontend/`, so you can run it alongside the API without moving directories outside of the project tree.

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

The frontend reads `NEXT_PUBLIC_API_URL` from `.env.local` to reach the Flask API.

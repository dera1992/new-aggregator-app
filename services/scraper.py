import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from datetime import datetime

from models.models import Article, db

RSS_FEEDS = {
    # Support multiple source feeds per category while preserving category mapping.
    "Tech": [
        "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml",
    ],
    "Business": [
        "https://feeds.bbci.co.uk/news/business/rss.xml",
        "https://www.theguardian.com/business/rss",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    ],
    "World": [
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
    ],
    "Politics": [
        "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
        "https://www.theguardian.com/politics/rss",
    ],
    "Sports": [
        "https://www.espn.com/espn/rss/news",
        "https://feeds.bbci.co.uk/sport/rss.xml",
    ],
    "Lifestyle": [
        "https://www.theguardian.com/lifeandstyle/rss",
        "http://rss.cnn.com/rss/cnn_style.rss",
        "https://www.vogue.com/feed/rss",
    ],
}

# Only attempt full-page scraping for these domains
# NYTimes will be RSS-only (blocked)
SCRAPE_ALLOWED_DOMAINS = {
    "www.espn.com",
    "reutersagency.com",
    "www.reutersagency.com",
    "reuters.com",
    "www.reuters.com",
}

HEADERS = {
    "User-Agent": "news-aggregator/1.0 (+https://yourdomain.example)",
    "Accept-Language": "en-GB,en;q=0.8",
}

def _safe_get(url: str, timeout=(5, 20)):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code == 403:
            return None, "blocked_403"
        if r.status_code == 429:
            return None, "blocked_429"
        r.raise_for_status()
        return r.text, "ok"
    except requests.RequestException:
        return None, "failed"

def _extract_text_generic(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    # remove obvious junk
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    paragraphs = soup.find_all("p")
    text = " ".join(p.get_text(" ", strip=True) for p in paragraphs)
    return " ".join(text.split())

def _extract_rss_summary(entry) -> str:
    # feedparser often exposes summary or description
    summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
    if not summary:
        return ""
    soup = BeautifulSoup(summary, "html.parser")
    return soup.get_text(" ", strip=True)

def _normalize_source_url(url: str) -> str:
    """Normalize URLs for reliable deduplication (e.g., strip UTM tracking params)."""
    parsed = urlparse(url)
    filtered_query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
    ]
    normalized_query = urlencode(filtered_query, doseq=True)
    return urlunparse(parsed._replace(query=normalized_query))

def run_harvester():
    """Loops through RSS feeds and saves new content to DB."""
    seen_urls = set()
    seen_hashes = set()

    for category, feed_urls in RSS_FEEDS.items():
        # Backward-compatible guard in case a category is still configured as a single URL.
        if isinstance(feed_urls, str):
            feed_urls = [feed_urls]

        # Iterate every configured feed URL per category.
        for feed_url in feed_urls:
            try:
                feed = feedparser.parse(feed_url)
            except Exception:
                # Keep harvesting even if one feed endpoint is unavailable.
                continue

            for entry in getattr(feed, "entries", []):
                link = getattr(entry, "link", None)
                title = getattr(entry, "title", None)
                if not link or not title:
                    continue

                normalized_link = _normalize_source_url(link)

                # URL dedupe (in-memory + persisted), now using normalized URLs.
                if len(normalized_link) > 500:
                    continue
                if (
                    normalized_link in seen_urls
                    or Article.query.filter_by(source_url=normalized_link).first()
                    or Article.query.filter_by(source_url=link).first()
                ):
                    continue

                source_domain = urlparse(normalized_link).netloc
                rss_summary = _extract_rss_summary(entry)

                raw_content = ""
                fetch_status = "rss_only"

                # Only scrape full page if allowed
                if source_domain in SCRAPE_ALLOWED_DOMAINS:
                    html, status = _safe_get(normalized_link)
                    fetch_status = status
                    if status == "ok" and html:
                        raw_content = _extract_text_generic(html)[:8000]
                    elif status in ("blocked_403", "blocked_429", "failed"):
                        # fallback to RSS summary when blocked/failed
                        raw_content = rss_summary[:2000] if rss_summary else ""
                else:
                    # Not allowed → RSS-only (keeps logs clean)
                    raw_content = rss_summary[:2000] if rss_summary else ""

                # If we still have no usable content, preserve ingestion with title fallback.
                if not raw_content:
                    raw_content = title[:2000]

                new_article = Article(
                    title=title,
                    source_url=normalized_link,
                    source_domain=source_domain,
                    raw_content=raw_content,
                    rss_summary=rss_summary,
                    fetch_status=fetch_status,
                    category=category,
                    created_at=datetime.utcnow(),
                )
                new_article.set_content_hash()

                # Hash dedupe (only if we have content)
                if new_article.content_hash:
                    if (
                        new_article.content_hash in seen_hashes
                        or Article.query.filter_by(content_hash=new_article.content_hash).first()
                    ):
                        continue
                    seen_hashes.add(new_article.content_hash)

                db.session.add(new_article)
                seen_urls.add(normalized_link)

    db.session.commit()


def run_trending_harvester(count: int = 10):
    """
    Fetches currently trending topics via Google Trends and scrapes
    Google News RSS for each topic, inserting new articles into the DB.
    Category is left unset so the AI summarizer assigns the real category.
    """
    from urllib.parse import quote_plus
    from services.trends_fetcher import get_trending_topics

    topics = get_trending_topics(count=count)
    if not topics:
        print("[trending] No trending topics available, skipping.")
        return

    seen_urls: set[str] = set()
    seen_hashes: set[str] = set()
    total_added = 0

    for topic in topics:
        feed_url = (
            f"https://news.google.com/rss/search"
            f"?q={quote_plus(topic)}&hl=en-US&gl=US&ceid=US:en"
        )
        try:
            feed = feedparser.parse(feed_url)
        except Exception:
            continue

        for entry in getattr(feed, "entries", [])[:5]:
            link = getattr(entry, "link", None)
            title = getattr(entry, "title", None)
            if not link or not title:
                continue

            normalized_link = _normalize_source_url(link)
            if len(normalized_link) > 500:
                continue
            if (
                normalized_link in seen_urls
                or Article.query.filter_by(source_url=normalized_link).first()
                or Article.query.filter_by(source_url=link).first()
            ):
                continue

            source_domain = urlparse(normalized_link).netloc
            rss_summary = _extract_rss_summary(entry)
            raw_content = rss_summary[:2000] if rss_summary else title[:2000]

            new_article = Article(
                title=title,
                source_url=normalized_link,
                source_domain=source_domain,
                raw_content=raw_content,
                rss_summary=rss_summary,
                fetch_status="rss_only",
                created_at=datetime.utcnow(),
            )
            new_article.set_content_hash()

            if new_article.content_hash:
                if (
                    new_article.content_hash in seen_hashes
                    or Article.query.filter_by(content_hash=new_article.content_hash).first()
                ):
                    continue
                seen_hashes.add(new_article.content_hash)

            db.session.add(new_article)
            seen_urls.add(normalized_link)
            total_added += 1

    db.session.commit()
    print(f"[trending] Added {total_added} new trending articles from {len(topics)} topics.")

import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from datetime import datetime

from models.models import Article, db

RSS_FEEDS = {
    "Tech": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "Business": "https://www.reutersagency.com/feed/?best-topics=business",
    "World": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "Politics": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "Sports": "https://www.espn.com/espn/rss/news",
    "Lifestyle": "https://www.reuters.com/lifestyle/",
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

def run_harvester():
    """Loops through RSS feeds and saves new content to DB."""
    seen_urls = set()
    seen_hashes = set()

    for category, feed_url in RSS_FEEDS.items():
        feed = feedparser.parse(feed_url)

        for entry in getattr(feed, "entries", []):
            link = getattr(entry, "link", None)
            title = getattr(entry, "title", None)
            if not link or not title:
                continue

            # URL dedupe
            if link in seen_urls or Article.query.filter_by(source_url=link).first():
                continue

            source_domain = urlparse(link).netloc
            rss_summary = _extract_rss_summary(entry)

            raw_content = ""
            fetch_status = "rss_only"

            # Only scrape full page if allowed
            if source_domain in SCRAPE_ALLOWED_DOMAINS:
                html, status = _safe_get(link)
                fetch_status = status
                if status == "ok" and html:
                    raw_content = _extract_text_generic(html)[:8000]
                elif status in ("blocked_403", "blocked_429", "failed"):
                    # fallback to RSS summary when blocked/failed
                    raw_content = rss_summary[:2000] if rss_summary else ""
            else:
                # Not allowed → RSS-only (keeps logs clean)
                raw_content = rss_summary[:2000] if rss_summary else ""

            new_article = Article(
                title=title,
                source_url=link,
                source_domain=source_domain,
                raw_content=raw_content,
                rss_summary=rss_summary,
                fetch_status=fetch_status,
                category=category,
                created_at=datetime.utcnow(),  # if you have this field
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
            seen_urls.add(link)

    db.session.commit()

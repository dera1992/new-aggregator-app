import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

from models.models import Article, db

RSS_FEEDS = {
    'Tech': 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'Business': 'https://www.reutersagency.com/feed/?best-topics=business',
}


def run_harvester():
    """Loops through RSS feeds and saves new content to DB."""
    headers = {"User-Agent": "new-aggregator-app/1.0"}
    for category, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        for entry in feed.entries:
            # Avoid duplicates by source URL
            if Article.query.filter_by(source_url=entry.link).first():
                continue

            try:
                # Basic Scraping of the full page content
                article_page = requests.get(entry.link, headers=headers, timeout=(3, 10))
                article_page.raise_for_status()
                soup = BeautifulSoup(article_page.text, 'html.parser')
                # Note: You'll need specific logic per site to find the 'body' tag
                paragraphs = soup.find_all('p')
                full_text = " ".join([p.get_text() for p in paragraphs])

                source_domain = urlparse(entry.link).netloc
                # Save to DB (AI processing happens next)
                new_article = Article(
                    title=entry.title,
                    source_url=entry.link,
                    source_domain=source_domain,
                    raw_content=full_text[:5000],  # Cap size
                    category=category
                )
                new_article.set_content_hash()

                # Avoid duplicates by content hash
                if Article.query.filter_by(content_hash=new_article.content_hash).first():
                    continue

                db.session.add(new_article)
            except Exception as exc:
                print(f"❌ Scraper error for {entry.link}: {exc}")
    db.session.commit()

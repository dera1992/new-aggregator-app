import feedparser
import requests
from bs4 import BeautifulSoup

from models.models import Article, db

RSS_FEEDS = {
    'Tech': 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'Business': 'https://www.reutersagency.com/feed/?best-topics=business',
}


def run_harvester():
    """Loops through RSS feeds and saves new content to DB."""
    for category, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        for entry in feed.entries:
            # Avoid duplicates
            if Article.query.filter_by(source_url=entry.link).first():
                continue

            # Basic Scraping of the full page content
            article_page = requests.get(entry.link).text
            soup = BeautifulSoup(article_page, 'html.parser')
            # Note: You'll need specific logic per site to find the 'body' tag
            paragraphs = soup.find_all('p')
            full_text = " ".join([p.get_text() for p in paragraphs])

            # Save to DB (AI processing happens next)
            new_article = Article(
                title=entry.title,
                source_url=entry.link,
                raw_content=full_text[:5000],  # Cap size
                category=category
            )
            db.session.add(new_article)
    db.session.commit()
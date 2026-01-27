from datetime import datetime, timedelta

from models.models import Article, User, UserPreferences
from services.email_service import send_email


def _current_digest_time():
    return datetime.utcnow().strftime("%H:%M")


def _collect_story_digest(query, limit=10):
    articles = query.order_by(Article.created_at.desc()).limit(200).all()
    stories = {}
    for article in articles:
        cid = article.cluster_id
        if cid not in stories:
            stories[cid] = {
                "title": article.title,
                "summary": article.ai_summary,
                "sources": [],
                "timestamp": article.created_at,
            }
        stories[cid]["sources"].append(article.source_domain)
    sorted_stories = sorted(stories.values(), key=lambda item: item["timestamp"], reverse=True)
    return sorted_stories[:limit]


def send_daily_digests():
    now_time = _current_digest_time()
    eligible_prefs = UserPreferences.query.filter_by(digest_enabled=True, digest_time=now_time).all()
    if not eligible_prefs:
        return

    since = datetime.utcnow() - timedelta(hours=24)

    for preferences in eligible_prefs:
        user = User.query.get(preferences.user_id)
        if not user:
            continue

        query = Article.query.filter(
            Article.cluster_id.isnot(None),
            Article.created_at >= since,
        )
        if preferences.preferred_categories:
            query = query.filter(Article.category.in_(preferences.preferred_categories))
        if preferences.preferred_sources:
            query = query.filter(Article.source_domain.in_(preferences.preferred_sources))

        stories = _collect_story_digest(query)
        if not stories:
            continue

        lines = ["Here is your daily news digest:\n"]
        for story in stories:
            sources = ", ".join(sorted(set(story["sources"])))
            lines.append(f"- {story['title']}\n  {story['summary']}\n  Sources: {sources}\n")

        send_email(
            to_email=user.email,
            subject="Your Daily News Digest",
            body="\n".join(lines),
        )

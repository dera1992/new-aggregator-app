from flask import Blueprint, jsonify
from models.models import Article
from utils.decorators import token_required

# Define the Blueprint
news_bp = Blueprint('news', __name__)


@news_bp.route('/api/news/feed', methods=['GET'])
@token_required
def get_clustered_feed():
    # 1. Fetch the last 100 processed articles
    articles = Article.query.filter(Article.cluster_id != None) \
        .order_by(Article.created_at.desc()) \
        .limit(100).all()

    # 2. Grouping logic
    stories = {}
    for a in articles:
        cid = a.cluster_id
        if cid not in stories:
            stories[cid] = {
                "story_title": a.title,
                "summary": a.ai_summary,
                "sources": [],
                "timestamp": a.created_at.isoformat()  # Convert for JSON
            }

        # Helper to get domain name from URL (e.g., nytimes.com)
        from urllib.parse import urlparse
        domain = urlparse(a.source_url).netloc

        stories[cid]["sources"].append({
            "name": domain,
            "url": a.source_url
        })

    return jsonify(list(stories.values()))
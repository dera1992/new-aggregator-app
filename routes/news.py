from datetime import datetime
from flask import Blueprint, jsonify, request
from models.models import Article
from utils.decorators import token_required

# Define the Blueprint
news_bp = Blueprint('news', __name__)


@news_bp.route('/api/news/feed', methods=['GET'])
@token_required
def get_clustered_feed():
    # Query params
    category = request.args.get("category")
    source = request.args.get("source")
    since = request.args.get("since")
    limit = min(int(request.args.get("limit", 100)), 200)
    offset = int(request.args.get("offset", 0))

    query = Article.query.filter(Article.cluster_id != None)
    if category:
        query = query.filter(Article.category == category)
    if source:
        query = query.filter(Article.source_domain == source)
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(Article.created_at >= since_dt)
        except ValueError:
            return jsonify({"message": "Invalid 'since' format. Use ISO-8601."}), 400

    # 1. Fetch the last processed articles
    articles = query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()

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

        stories[cid]["sources"].append({
            "name": a.source_domain,
            "url": a.source_url
        })

    return jsonify({
        "stories": list(stories.values()),
        "count": len(stories),
        "offset": offset,
        "limit": limit
    })


@news_bp.route('/api/news/archive', methods=['GET'])
@token_required
def get_news_archive():
    category = request.args.get("category")
    source = request.args.get("source")
    before = request.args.get("before")
    limit = min(int(request.args.get("limit", 100)), 200)
    offset = int(request.args.get("offset", 0))

    query = Article.query
    if category:
        query = query.filter(Article.category == category)
    if source:
        query = query.filter(Article.source_domain == source)
    if before:
        try:
            before_dt = datetime.fromisoformat(before)
            query = query.filter(Article.created_at <= before_dt)
        except ValueError:
            return jsonify({"message": "Invalid 'before' format. Use ISO-8601."}), 400

    articles = query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "articles": [
            {
                "title": a.title,
                "summary": a.ai_summary,
                "category": a.category,
                "source": a.source_domain,
                "url": a.source_url,
                "timestamp": a.created_at.isoformat(),
                "cluster_id": a.cluster_id,
            }
            for a in articles
        ],
        "count": len(articles),
        "offset": offset,
        "limit": limit,
    })


@news_bp.route('/api/news/story/<int:cluster_id>', methods=['GET'])
@token_required
def get_story(cluster_id):
    articles = Article.query.filter(Article.cluster_id == cluster_id) \
        .order_by(Article.created_at.desc()).all()

    if not articles:
        return jsonify({"message": "Story not found"}), 404

    return jsonify({
        "cluster_id": cluster_id,
        "story_title": articles[0].title,
        "summary": articles[0].ai_summary,
        "sources": [
            {"name": a.source_domain, "url": a.source_url, "title": a.title}
            for a in articles
        ]
    })

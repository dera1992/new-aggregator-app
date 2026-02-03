from datetime import datetime
from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError
from models.models import Article, SavedArticle, ReadArticle, UserPreferences, db
from schemas.comment import CommentRequest
from schemas.viral_post import ViralPostRequest
from services.comment_generator import generate_comment, CommentGenError
from services.viral_generator import generate_viral_post, ViralPostError
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

    query = Article.query.filter(Article.cluster_id.isnot(None))
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


@news_bp.route("/api/news/personalized", methods=["GET"])
@token_required
def get_personalized_feed():
    category = request.args.get("category")
    source = request.args.get("source")
    since = request.args.get("since")
    limit = min(int(request.args.get("limit", 100)), 200)
    offset = int(request.args.get("offset", 0))

    preferences = UserPreferences.query.filter_by(user_id=g.current_user.id).first()
    preferred_categories = preferences.preferred_categories if preferences else []
    preferred_sources = preferences.preferred_sources if preferences else []

    query = Article.query.filter(Article.cluster_id.isnot(None))
    if preferred_categories:
        query = query.filter(Article.category.in_(preferred_categories))
    if preferred_sources:
        query = query.filter(Article.source_domain.in_(preferred_sources))
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

    articles = query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()

    stories = {}
    for a in articles:
        cid = a.cluster_id
        if cid not in stories:
            stories[cid] = {
                "story_title": a.title,
                "summary": a.ai_summary,
                "sources": [],
                "timestamp": a.created_at.isoformat()
            }
        stories[cid]["sources"].append({
            "name": a.source_domain,
            "url": a.source_url
        })

    return jsonify({
        "stories": list(stories.values()),
        "count": len(stories),
        "offset": offset,
        "limit": limit,
        "preferences": {
            "preferred_categories": preferred_categories,
            "preferred_sources": preferred_sources,
        },
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


@news_bp.route("/api/news/save", methods=["POST"])
@token_required
def save_article():
    data = request.get_json(silent=True) or {}
    article_id = data.get("article_id")
    if not article_id:
        return jsonify({"message": "article_id is required."}), 400

    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"message": "Article not found."}), 404

    existing = SavedArticle.query.filter_by(
        user_id=g.current_user.id,
        article_id=article_id,
    ).first()
    if existing:
        return jsonify({"message": "Article already saved."}), 200

    saved = SavedArticle(user_id=g.current_user.id, article_id=article_id)
    db.session.add(saved)
    db.session.commit()
    return jsonify({"message": "Article saved."}), 201


@news_bp.route("/api/news/saved", methods=["GET"])
@token_required
def list_saved_articles():
    saved_entries = (
        SavedArticle.query.filter_by(user_id=g.current_user.id)
        .order_by(SavedArticle.created_at.desc())
        .all()
    )
    articles = []
    for entry in saved_entries:
        article = db.session.get(Article, entry.article_id)
        if article:
            articles.append({
                "title": article.title,
                "summary": article.ai_summary,
                "category": article.category,
                "source": article.source_domain,
                "url": article.source_url,
                "timestamp": article.created_at.isoformat(),
                "cluster_id": article.cluster_id,
                "saved_at": entry.created_at.isoformat(),
            })
    return jsonify({"articles": articles, "count": len(articles)})


@news_bp.route("/api/news/read", methods=["POST"])
@token_required
def mark_article_read():
    data = request.get_json(silent=True) or {}
    article_id = data.get("article_id")
    if not article_id:
        return jsonify({"message": "article_id is required."}), 400

    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"message": "Article not found."}), 404

    existing = ReadArticle.query.filter_by(
        user_id=g.current_user.id,
        article_id=article_id,
    ).first()
    if existing:
        return jsonify({"message": "Article already marked as read."}), 200

    read_entry = ReadArticle(user_id=g.current_user.id, article_id=article_id)
    db.session.add(read_entry)
    db.session.commit()
    return jsonify({"message": "Article marked as read."}), 201


@news_bp.route("/api/news/read-articles", methods=["GET"])
@token_required
def list_read_articles():
    read_entries = (
        ReadArticle.query.filter_by(user_id=g.current_user.id)
        .order_by(ReadArticle.created_at.desc())
        .all()
    )
    articles = []
    for entry in read_entries:
        article = db.session.get(Article, entry.article_id)
        if article:
            articles.append({
                "title": article.title,
                "summary": article.ai_summary,
                "category": article.category,
                "source": article.source_domain,
                "url": article.source_url,
                "timestamp": article.created_at.isoformat(),
                "cluster_id": article.cluster_id,
                "read_at": entry.created_at.isoformat(),
            })
    return jsonify({"articles": articles, "count": len(articles)})


@news_bp.route("/api/news/generate-viral-post", methods=["POST"])
@token_required
def generate_viral_post_endpoint():
    payload = request.get_json(silent=True) or {}
    try:
        request_data = ViralPostRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    try:
        result = generate_viral_post(**request_data.model_dump())
    except ViralPostError as exc:
        return jsonify({"message": str(exc)}), 502

    return jsonify(result)


@news_bp.route("/api/news/generate-comment", methods=["POST"])
@token_required
def generate_comment_endpoint():
    payload = request.get_json(silent=True) or {}
    try:
        request_data = CommentRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    try:
        result = generate_comment(**request_data.model_dump())
    except CommentGenError as exc:
        return jsonify({"message": str(exc)}), 502

    return jsonify(result)

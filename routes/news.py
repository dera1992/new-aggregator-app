from datetime import datetime
from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError
from sqlalchemy import func
from models.models import Article, SavedArticle, ReadArticle, UserPreferences, db
from schemas.comment import CommentRequest
from schemas.analysis import AnalysisRequest
from schemas.joke import JokeRequest
from schemas.viral_post import ViralPostRequest
from schemas.paste import PasteTextRequest, SummaryRequest, URLRequest
from schemas.perspective import PerspectiveRequest
from services.comment_generator import generate_comment, CommentGenError
from services.analysis_generator import generate_analysis, AnalysisGenError
from services.joke_generator import generate_joke, JokeGenError
from services.viral_generator import generate_viral_post, ViralPostError
from services.perspective_generator import generate_perspective, generate_perspective_from_text, PerspectiveError
from services.trends_fetcher import get_trending_topics
from services.summary_generator import generate_summary, SummaryGenError
from services.ai_router import PROMPT_VERSIONS, run_task
from services.url_text_extractor import extract_text_from_url, URLExtractError
from utils.decorators import token_required
from utils.credits import check_and_deduct_credits
from extensions import limiter

news_bp = Blueprint('news', __name__)

# Per-user rate limit applied to all AI generation endpoints.
# 60 calls/hour is generous for legitimate use but blocks scripted abuse.
_AI_RATE_LIMIT = "60 per hour"


def _normalize_fact_mode_value(value):
    if isinstance(value, bool):
        return "strict" if value else "balanced"
    if isinstance(value, str):
        cleaned = value.strip().lower()
        return cleaned or "strict"
    return value


def _normalize_joke_fact_mode(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        cleaned = value.strip().lower()
        if cleaned in {"true", "1", "yes", "on", "strict"}:
            return True
        if cleaned in {"false", "0", "no", "off", "balanced"}:
            return False
    return value


def _normalize_generation_payload(payload):
    normalized = dict(payload)
    if "fact_mode" in normalized:
        normalized["fact_mode"] = _normalize_fact_mode_value(normalized.get("fact_mode"))
    return normalized


@news_bp.route('/api/news/sources', methods=['GET'])
@token_required
def get_sources():
    rows = (
        db.session.query(Article.source_domain)
        .filter(Article.source_domain.isnot(None))
        .distinct()
        .order_by(Article.source_domain)
        .all()
    )
    return jsonify({"sources": [r[0] for r in rows]})


@news_bp.route('/api/news/trends', methods=['GET'])
@token_required
def get_trends():
    count = min(int(request.args.get('count', 10)), 20)
    topics = get_trending_topics(count=count)
    return jsonify({"topics": topics})


@news_bp.route('/api/news/feed', methods=['GET'])
@token_required
def get_clustered_feed():
    # Query params
    category = request.args.get("category")
    source = request.args.get("source")
    since = request.args.get("since")
    limit = min(int(request.args.get("limit", 100)), 200)
    offset = int(request.args.get("offset", 0))

    base_filter = [Article.cluster_id.isnot(None)]
    if category:
        base_filter.append(Article.category == category)
    if source:
        base_filter.append(Article.source_domain == source)
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            base_filter.append(Article.created_at >= since_dt)
        except ValueError:
            return jsonify({"message": "Invalid 'since' format. Use ISO-8601."}), 400

    # 1. Total distinct clusters (for pagination)
    total = (
        db.session.query(func.count(Article.cluster_id.distinct()))
        .filter(*base_filter)
        .scalar() or 0
    )

    # 2. Paginate on distinct clusters so limit/offset reflects stories, not articles.
    cluster_subq = (
        db.session.query(
            Article.cluster_id,
            func.max(Article.created_at).label("latest"),
        )
        .filter(*base_filter)
        .group_by(Article.cluster_id)
        .order_by(func.max(Article.created_at).desc())
        .offset(offset)
        .limit(limit)
        .subquery()
    )

    articles = (
        Article.query
        .join(cluster_subq, Article.cluster_id == cluster_subq.c.cluster_id)
        .filter(*base_filter)
        .order_by(cluster_subq.c.latest.desc(), Article.created_at.desc())
        .all()
    )

    # 3. Grouping logic
    stories = {}
    for a in articles:
        cid = a.cluster_id
        if cid not in stories:
            stories[cid] = {
                "cluster_id": cid,
                "story_title": a.title,
                "summary": a.ai_summary,
                "sources": [],
                "timestamp": a.created_at.isoformat(),
                "lead_article_id": a.id,
                "primary_article_id": a.id,
            }
        stories[cid]["sources"].append({
            "article_id": a.id,
            "name": a.source_domain,
            "url": a.source_url,
            "title": a.title,
        })

    return jsonify({
        "stories": list(stories.values()),
        "count": len(stories),
        "total": total,
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

    base_filter = [Article.cluster_id.isnot(None)]
    if preferred_categories:
        base_filter.append(Article.category.in_(preferred_categories))
    if preferred_sources:
        base_filter.append(Article.source_domain.in_(preferred_sources))
    if category:
        base_filter.append(Article.category == category)
    if source:
        base_filter.append(Article.source_domain == source)
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            base_filter.append(Article.created_at >= since_dt)
        except ValueError:
            return jsonify({"message": "Invalid 'since' format. Use ISO-8601."}), 400

    total = (
        db.session.query(func.count(Article.cluster_id.distinct()))
        .filter(*base_filter)
        .scalar() or 0
    )

    cluster_subq = (
        db.session.query(
            Article.cluster_id,
            func.max(Article.created_at).label("latest"),
        )
        .filter(*base_filter)
        .group_by(Article.cluster_id)
        .order_by(func.max(Article.created_at).desc())
        .offset(offset)
        .limit(limit)
        .subquery()
    )

    articles = (
        Article.query
        .join(cluster_subq, Article.cluster_id == cluster_subq.c.cluster_id)
        .filter(*base_filter)
        .order_by(cluster_subq.c.latest.desc(), Article.created_at.desc())
        .all()
    )

    stories = {}
    for a in articles:
        cid = a.cluster_id
        if cid not in stories:
            stories[cid] = {
                "cluster_id": cid,
                "story_title": a.title,
                "summary": a.ai_summary,
                "sources": [],
                "timestamp": a.created_at.isoformat(),
                "lead_article_id": a.id,
                "primary_article_id": a.id,
            }
        stories[cid]["sources"].append({
            "article_id": a.id,
            "name": a.source_domain,
            "url": a.source_url,
            "title": a.title,
        })

    return jsonify({
        "stories": list(stories.values()),
        "count": len(stories),
        "total": total,
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

    since = request.args.get("since")
    summarized_only = request.args.get("summarized_only", "false").lower() == "true"

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
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(Article.created_at >= since_dt)
        except ValueError:
            return jsonify({"message": "Invalid 'since' format. Use ISO-8601."}), 400
    if summarized_only:
        query = query.filter(Article.ai_summary != None)

    total_count = query.count()
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
                "article_id": a.id,
            }
            for a in articles
        ],
        "count": total_count,
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

    primary_summary = (
        articles[0].ai_summary
        or articles[0].rss_summary
        or " ".join((articles[0].raw_content or "").split()[:80]).strip()
        or articles[0].title
    )

    return jsonify({
        "cluster_id": cluster_id,
        "story_title": articles[0].title,
        "summary": primary_summary,
        "sources": [
            {
                "article_id": a.id,
                "name": a.source_domain,
                "url": a.source_url,
                "title": a.title,
            }
            for a in articles
        ]
    })


@news_bp.route('/api/news/generate-perspective', methods=['POST'])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_perspective_endpoint():
    payload = _normalize_generation_payload(request.get_json(silent=True) or {})
    try:
        request_data = PerspectiveRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    try:
        routed = run_task(
            "perspective",
            user_id=g.current_user.id,
            cluster_id=request_data.cluster_id,
            input_text=f"cluster:{request_data.cluster_id}",
            params={"tone": request_data.tone, "slang_level": request_data.slang_level},
            model="gpt-4o-mini",
            prompt_version=PROMPT_VERSIONS["perspective"],
            ttl_hours=12,
            force_refresh=request_data.force_refresh,
            generator_fn=lambda **_kw: generate_perspective(
                cluster_id=request_data.cluster_id,
                tone=request_data.tone,
                slang_level=request_data.slang_level,
            ),
        )
    except PerspectiveError as exc:
        message = str(exc)
        status = 404 if message == "Story not found." else 502
        return jsonify({"message": message}), status

    cache_hit = routed.get("cache_hit", False)
    credit_err = check_and_deduct_credits(g.current_user, "perspective", cache_hit)
    if credit_err:
        return credit_err

    response = {k: v for k, v in routed.items() if k != "cache_hit"}
    return jsonify(response)


@news_bp.route('/api/news/generate-perspective-from-text', methods=['POST'])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_perspective_from_text_endpoint():
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    if len(text) < 50:
        return jsonify({'message': 'Provide at least 50 characters of text.'}), 400
    tone = data.get('tone', 'neutral')
    slang_level = data.get('slang_level', 'none')
    try:
        result = generate_perspective_from_text(text, tone, slang_level)
    except PerspectiveError as exc:
        return jsonify({'message': str(exc)}), 422
    credit_err = check_and_deduct_credits(g.current_user, 'perspective', False)
    if credit_err:
        return credit_err
    return jsonify(result)


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


@news_bp.route("/api/news/save/<int:article_id>", methods=["DELETE"])
@token_required
def unsave_article(article_id):
    entry = SavedArticle.query.filter_by(
        user_id=g.current_user.id,
        article_id=article_id,
    ).first()
    if not entry:
        return jsonify({"message": "Article not saved."}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Article removed from saved."}), 200


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
                "article_id": article.id,
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
                "article_id": article.id,
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


@news_bp.route("/api/news/read/<int:article_id>", methods=["DELETE"])
@token_required
def unread_article(article_id):
    entry = ReadArticle.query.filter_by(user_id=g.current_user.id, article_id=article_id).first()
    if not entry:
        return jsonify({"message": "Article not in read history."}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Removed from read history."}), 200


@news_bp.route("/api/news/read-articles", methods=["DELETE"])
@token_required
def clear_read_history():
    ReadArticle.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()
    return jsonify({"message": "Read history cleared."}), 200


@news_bp.route("/api/news/generate-viral-post", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_viral_post_endpoint():
    payload = request.get_json(silent=True) or {}
    if "summary" not in payload and "text" in payload:
        try:
            paste_request = PasteTextRequest.model_validate(payload)
        except ValidationError as exc:
            return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

        try:
            summary_result = generate_summary(
                text=paste_request.text,
                style="standard",
                max_length=None,
                fact_mode=paste_request.fact_mode,
                model=paste_request.model,
            )
        except SummaryGenError as exc:
            return jsonify({"message": str(exc)}), 502

        payload = {**payload, "summary": summary_result["summary"]}
        payload.pop("text", None)

    payload = _normalize_generation_payload(payload)

    try:
        request_data = ViralPostRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    request_payload = request_data.model_dump()
    force_refresh = request_payload.pop("force_refresh", False)

    params = {
        "platform": request_payload["platform"],
        "tone": request_payload["tone"],
        "goal": request_payload["goal"],
        "audience": request_payload["audience"],
        "brand_voice": request_payload["brand_voice"],
        "max_variants": request_payload["max_variants"],
        "fact_mode": request_payload["fact_mode"],
    }

    try:
        routed = run_task(
            "viral_post",
            user_id=g.current_user.id,
            input_text=request_payload["summary"],
            params=params,
            model="gpt-4o-mini",
            prompt_version=PROMPT_VERSIONS["viral_post"],
            ttl_hours=48,
            force_refresh=force_refresh,
            generator_fn=lambda **_kw: generate_viral_post(**request_payload),
        )
    except ViralPostError as exc:
        return jsonify({"message": str(exc)}), 502

    cache_hit = routed.get("cache_hit", False)
    credit_err = check_and_deduct_credits(g.current_user, "viral_post", cache_hit)
    if credit_err:
        return credit_err

    response = {k: v for k, v in routed.items() if k != "cache_hit"}
    return jsonify(response)


@news_bp.route("/api/news/generate-comment", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_comment_endpoint():
    payload = request.get_json(silent=True) or {}
    if "summary" not in payload and "text" in payload:
        try:
            paste_request = PasteTextRequest.model_validate(payload)
        except ValidationError as exc:
            return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

        try:
            summary_result = generate_summary(
                text=paste_request.text,
                style="standard",
                max_length=None,
                fact_mode=paste_request.fact_mode,
                model=paste_request.model,
            )
        except SummaryGenError as exc:
            return jsonify({"message": str(exc)}), 502

        payload = {**payload, "summary": summary_result["summary"]}
        payload.pop("text", None)

    payload = _normalize_generation_payload(payload)

    try:
        request_data = CommentRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    request_payload = request_data.model_dump()
    force_refresh = request_payload.pop("force_refresh", False)

    params = {
        "platform": request_payload["platform"],
        "style": request_payload["style"],
        "audience": request_payload["audience"],
        "max_variants": request_payload["max_variants"],
        "fact_mode": request_payload["fact_mode"],
    }

    try:
        routed = run_task(
            "comment",
            user_id=g.current_user.id,
            input_text=request_payload["summary"],
            params=params,
            model="gpt-4o-mini",
            prompt_version=PROMPT_VERSIONS["comment"],
            ttl_hours=24,
            force_refresh=force_refresh,
            generator_fn=lambda **_kw: generate_comment(**request_payload),
        )
    except CommentGenError as exc:
        return jsonify({"message": str(exc)}), 502

    cache_hit = routed.get("cache_hit", False)
    credit_err = check_and_deduct_credits(g.current_user, "comment", cache_hit)
    if credit_err:
        return credit_err

    response = {k: v for k, v in routed.items() if k != "cache_hit"}
    return jsonify(response)


@news_bp.route("/api/news/generate-joke", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_joke_endpoint():
    payload = request.get_json(silent=True) or {}
    if "fact_mode" in payload:
        payload["fact_mode"] = _normalize_joke_fact_mode(payload.get("fact_mode"))
    if "summary" not in payload and "text" in payload:
        try:
            paste_request = PasteTextRequest.model_validate(payload)
        except ValidationError as exc:
            return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

        try:
            summary_result = generate_summary(
                text=paste_request.text,
                style="standard",
                max_length=None,
                fact_mode=paste_request.fact_mode,
                model=paste_request.model,
            )
        except SummaryGenError as exc:
            return jsonify({"message": str(exc)}), 502

        payload = {**payload, "summary": summary_result["summary"]}
        payload.pop("text", None)

    payload = _normalize_generation_payload(payload)

    try:
        request_data = JokeRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    request_payload = request_data.model_dump()
    force_refresh = request_payload.pop("force_refresh", False)
    selected_model = request_payload.get("model") or "gpt-4o-mini"

    params = {
        "platform": request_payload["platform"],
        "style": request_payload["style"],
        "audience": request_payload["audience"],
        "max_variants": request_payload["max_variants"],
        "fact_mode": request_payload["fact_mode"],
    }

    try:
        routed = run_task(
            "joke",
            user_id=g.current_user.id,
            input_text=request_payload["summary"],
            params=params,
            model=selected_model,
            prompt_version=PROMPT_VERSIONS["joke"],
            ttl_hours=24,
            force_refresh=force_refresh,
            generator_fn=lambda **_kw: generate_joke(**request_payload),
        )
    except JokeGenError as exc:
        return jsonify({"message": str(exc)}), 502

    cache_hit = routed.get("cache_hit", False)
    credit_err = check_and_deduct_credits(g.current_user, "joke", cache_hit)
    if credit_err:
        return credit_err

    response = {k: v for k, v in routed.items() if k != "cache_hit"}
    return jsonify(response)


@news_bp.route("/api/news/generate-analysis", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_analysis_endpoint():
    payload = request.get_json(silent=True) or {}
    if "summary" not in payload and "text" in payload:
        try:
            paste_request = PasteTextRequest.model_validate(payload)
        except ValidationError as exc:
            return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

        try:
            summary_result = generate_summary(
                text=paste_request.text,
                style="standard",
                max_length=None,
                fact_mode=paste_request.fact_mode,
                model=paste_request.model,
            )
        except SummaryGenError as exc:
            return jsonify({"message": str(exc)}), 502

        payload = {**payload, "summary": summary_result["summary"]}
        payload.pop("text", None)

    try:
        request_data = AnalysisRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    request_payload = request_data.model_dump()
    force_refresh = request_payload.pop("force_refresh", False)
    selected_model = request_payload.get("model") or "gpt-4o-mini"

    params = {
        "format": request_payload["format"],
        "tone": request_payload["tone"],
        "audience": request_payload["audience"],
        "include_takeaways": request_payload["include_takeaways"],
        "include_counterpoints": request_payload["include_counterpoints"],
        "include_what_to_watch": request_payload["include_what_to_watch"],
        "fact_mode": request_payload["fact_mode"],
    }

    try:
        routed = run_task(
            "analysis",
            user_id=g.current_user.id,
            input_text=request_payload["summary"],
            params=params,
            model=selected_model,
            prompt_version=PROMPT_VERSIONS["analysis"],
            ttl_hours=12,
            force_refresh=force_refresh,
            generator_fn=lambda **_kw: generate_analysis(**request_payload),
        )
    except AnalysisGenError as exc:
        return jsonify({"message": str(exc)}), 502

    cache_hit = routed.get("cache_hit", False)
    credit_err = check_and_deduct_credits(g.current_user, "analysis", cache_hit)
    if credit_err:
        return credit_err

    response = {k: v for k, v in routed.items() if k != "cache_hit"}
    return jsonify(response)


@news_bp.route("/api/news/extract-url-text", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def extract_url_text_endpoint():
    payload = request.get_json(silent=True) or {}
    try:
        request_data = URLRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    try:
        result = extract_text_from_url(str(request_data.url))
    except URLExtractError as exc:
        return jsonify({"message": str(exc)}), 400
    except Exception:
        return jsonify({"message": "Unable to fetch or parse this URL right now."}), 502

    return jsonify({
        "url": str(request_data.url),
        "text": result["text"],
        "source_type": result["source_type"],
    })


@news_bp.route("/api/news/generate-summary", methods=["POST"])
@token_required
@limiter.limit(_AI_RATE_LIMIT)
def generate_summary_endpoint():
    payload = request.get_json(silent=True) or {}
    try:
        request_data = SummaryRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"message": "Invalid request payload.", "errors": exc.errors()}), 400

    try:
        result = generate_summary(**request_data.model_dump())
    except SummaryGenError as exc:
        return jsonify({"message": str(exc)}), 502

    return jsonify(result)

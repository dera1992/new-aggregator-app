from models.models import db, Article
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import or_
import numpy as np
from datetime import datetime, timedelta

# Load the model once
model = SentenceTransformer('all-MiniLM-L6-v2')


def cluster_recent_articles(window_hours=72):
    """
    Groups articles into stories.
    Includes articles from the last `window_hours` hours PLUS any
    previously summarized articles that have never been clustered yet.
    """
    time_threshold = datetime.utcnow() - timedelta(hours=window_hours)
    articles = Article.query.filter(
        Article.ai_summary != None,
        or_(
            Article.created_at >= time_threshold,  # recent articles
            Article.cluster_id == None,            # older articles never clustered
        )
    ).all()

    if len(articles) < 2:
        return

    # 2. Prepare text for embedding (Title + Summary gives best context)
    texts = [f"{a.title}. {a.ai_summary}" for a in articles]
    embeddings = model.encode(texts)

    # 3. Calculate similarity and cluster
    # We use a threshold of 0.85 similarity (0.15 distance)
    similarity_matrix = cosine_similarity(embeddings)
    clustering_model = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=0.15,
        linkage='average',
        metric='precomputed'
    )

    # Predict clusters
    labels = clustering_model.fit_predict(1 - similarity_matrix)

    # 4. Update the Database with stable cluster IDs.
    # Group articles by their assigned label first.
    cluster_to_articles: dict[int, list] = {}
    for i, article in enumerate(articles):
        cluster_to_articles.setdefault(int(labels[i]), []).append(article)

    for cluster_articles in cluster_to_articles.values():
        # Use the smallest article.id in the cluster as the stable cluster_id.
        # Article IDs are auto-incremented so new articles never lower the min,
        # keeping the ID consistent across re-clustering runs.
        stable_id = min(a.id for a in cluster_articles)
        for article in cluster_articles:
            article.cluster_id = stable_id

    db.session.commit()
    print(f" Successfully grouped {len(articles)} articles into {len(set(labels))} stories.")
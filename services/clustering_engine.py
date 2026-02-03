from models.models import db, Article
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime, timedelta

# Load the model once
model = SentenceTransformer('all-MiniLM-L6-v2')


def cluster_recent_articles(window_hours=24):
    """
    Groups articles from the last X hours into stories.
    """
    # 1. Fetch articles from the last 24 hours that have been summarized
    time_threshold = datetime.utcnow() - timedelta(hours=window_hours)
    articles = Article.query.filter(
        Article.created_at >= time_threshold,
        Article.ai_summary != None
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

    # 4. Update the Database
    # We use the current timestamp to make cluster IDs unique across different windows
    base_id = int(datetime.utcnow().timestamp())
    for i, article in enumerate(articles):
        article.cluster_id = base_id + int(labels[i])

    db.session.commit()
    print(f" Successfully grouped {len(articles)} articles into {len(set(labels))} stories.")
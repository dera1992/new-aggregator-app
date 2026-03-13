from models.models import db, Article
from openai import OpenAI
import os
import json
from datetime import datetime

VALID_CATEGORIES = {"Tech", "Business", "Sports", "Politics", "Lifestyle", "Health", "Science", "Entertainment", "General"}

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def process_unsummarized_news():
    """
    Finds articles without summaries, generates them using AI,
    and updates the database.
    """
    # 1. Fetch articles that haven't been processed yet
    # Limit to 5-10 per run to stay within OpenAI rate limits and manage costs
    pending_articles = Article.query.filter(Article.ai_summary == None).order_by(Article.created_at.desc()).limit(30).all()

    if not pending_articles:
        print("No new articles to process.")
        return

    print(f"AI is processing {len(pending_articles)} new articles...")

    for article in pending_articles:
        try:
            # 2. Call OpenAI to summarize and categorize the raw content
            summary_style = article.summary_style or "bullets-3"
            if summary_style == "short":
                summary_instruction = "Summarize this news in 2 short sentences."
            elif summary_style == "detailed":
                summary_instruction = "Summarize this news in 5 bullet points with key details."
            else:
                summary_instruction = "Summarize this news in 3 bullet points."

            system_prompt = (
                f"{summary_instruction} "
                f"Also classify it into exactly one category from: Tech, Business, Sports, Politics, Lifestyle, Health, Science, Entertainment, General. "
                f"Respond with JSON only: {{\"summary\": \"...\", \"category\": \"...\"}}"
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": (article.raw_content or "")[:4000]},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            # 3. Parse response and update the database record
            raw = response.choices[0].message.content.strip()
            parsed = json.loads(raw)
            summary_raw = parsed.get("summary", "")
            if isinstance(summary_raw, list):
                summary = "\n".join(f"• {s}" for s in summary_raw).strip()
            else:
                summary = str(summary_raw).strip()
            category = str(parsed.get("category", "General")).strip()
            if category not in VALID_CATEGORIES:
                category = "General"

            article.ai_summary = summary
            article.category = article.category or category  # don't overwrite if already set
            article.summary_error = None
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f" Summarized [{category}]: {article.title[:50]}...")

        except Exception as e:
            db.session.rollback()
            article.summary_error = str(e)
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f" AI Error on article {article.id}: {e}")

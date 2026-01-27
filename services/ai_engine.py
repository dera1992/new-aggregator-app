from models.models import db, Article
from openai import OpenAI
import os
from datetime import datetime

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def process_unsummarized_news():
    """
    Finds articles without summaries, generates them using AI,
    and updates the database.
    """
    # 1. Fetch articles that haven't been processed yet
    # Limit to 5-10 per run to stay within OpenAI rate limits and manage costs
    pending_articles = Article.query.filter(Article.ai_summary == None).limit(10).all()

    if not pending_articles:
        print("☕ No new articles to process.")
        return

    print(f"🤖 AI is processing {len(pending_articles)} new articles...")

    for article in pending_articles:
        try:
            # 2. Call OpenAI to summarize the raw content
            summary_style = article.summary_style or "bullets-3"
            system_prompt = "Summarize this news in 3 bullet points."
            if summary_style == "short":
                system_prompt = "Summarize this news in 2 short sentences."
            elif summary_style == "detailed":
                system_prompt = "Summarize this news in 5 bullet points with key details."

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": (article.raw_content or "")[:4000],
                    }  # Context window safety
                ],
                temperature=0.3
            )

            # 3. Update the database record
            article.ai_summary = response.choices[0].message.content.strip()
            article.summary_error = None
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f"✅ Summarized: {article.title[:50]}...")

        except Exception as e:
            db.session.rollback()
            article.summary_error = str(e)
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f"❌ AI Error on article {article.id}: {e}")

from models.models import db, Article
from openai import OpenAI
import os
import json
from datetime import datetime

VALID_CATEGORIES = {"Tech", "Business", "Sports", "Politics", "Lifestyle", "Health", "Science", "Entertainment", "General"}

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Articles with less content than this are too thin to summarize accurately.
# They will be marked with a placeholder and skipped to avoid hallucination.
_MIN_CONTENT_LENGTH = 120

_FAITHFULNESS_RULE = (
    "STRICT RULE: Only use information that is explicitly stated in the article text provided. "
    "Do not add context, background knowledge, dates, statistics, or details from outside the article. "
    "If the article text is limited, only summarize what is actually there — do not fill gaps."
)


def _build_content(article) -> str:
    """Return the richest available content for an article, prefixed with its title."""
    raw = (article.raw_content or "").strip()
    rss = (article.rss_summary or "").strip()
    body = raw if len(raw) >= len(rss) else rss
    return f"Title: {article.title}\n\n{body}"


def process_unsummarized_news():
    """
    Finds articles without summaries, generates them using AI,
    and updates the database.
    """
    pending_articles = (
        Article.query
        .filter(Article.ai_summary == None)
        .order_by(Article.created_at.desc())
        .limit(30)
        .all()
    )

    if not pending_articles:
        print("No new articles to process.")
        return

    print(f"AI is processing {len(pending_articles)} new articles...")

    for article in pending_articles:
        try:
            raw = (article.raw_content or "").strip()
            rss = (article.rss_summary or "").strip()
            best_content = raw if len(raw) >= len(rss) else rss

            # Skip articles whose content is too thin — summarizing them risks
            # producing misleading output. Mark processed_at so they aren't
            # retried on every run; summary stays NULL until content improves.
            if len(best_content) < _MIN_CONTENT_LENGTH:
                article.summary_error = "insufficient_content"
                article.processed_at = datetime.utcnow()
                db.session.commit()
                print(f"  Skipped (too thin): {article.title[:60]}")
                continue

            summary_style = article.summary_style or "bullets-3"
            if summary_style == "short":
                summary_instruction = (
                    "Write 2 concise sentences summarising this news article. "
                    "Include specific names, companies, figures, and events directly from the text."
                )
            elif summary_style == "detailed":
                summary_instruction = (
                    "Write 5 bullet points summarising this news article. "
                    "Each bullet must contain a specific fact from the text: "
                    "names, companies, numbers, or events."
                )
            else:
                summary_instruction = (
                    "Write exactly 3 bullet points summarising this news article. "
                    "Each bullet must state one specific fact directly from the article text: "
                    "include real names, companies, percentages, or events mentioned in the article."
                )

            system_prompt = (
                f"{summary_instruction}\n\n"
                f"{_FAITHFULNESS_RULE}\n\n"
                f"Also classify it into exactly one category from: "
                f"Tech, Business, Sports, Politics, Lifestyle, Health, Science, Entertainment, General.\n"
                f"Respond with JSON only: {{\"summary\": \"...\", \"category\": \"...\"}}"
            )

            user_content = _build_content(article)[:6000]

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            parsed = json.loads(response.choices[0].message.content.strip())
            summary_raw = parsed.get("summary", "")
            if isinstance(summary_raw, list):
                summary = "\n".join(f"• {s}" for s in summary_raw).strip()
            else:
                summary = str(summary_raw).strip()

            category = str(parsed.get("category", "General")).strip()
            if category not in VALID_CATEGORIES:
                category = "General"

            article.ai_summary = summary
            article.category = article.category or category
            article.summary_error = None
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f"  Summarized [{category}]: {article.title[:60]}")

        except Exception as e:
            db.session.rollback()
            article.summary_error = str(e)
            article.processed_at = datetime.utcnow()
            db.session.commit()
            print(f"  AI Error on article {article.id}: {e}")

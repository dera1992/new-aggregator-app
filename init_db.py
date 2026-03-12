from sqlalchemy import text
from app import create_app
from models.models import (
    db, User, UserProfile, Article, UserPreferences,
    SavedArticle, ReadArticle, StoryInsight, AIOutputCache, AIUsageLog
)

app = create_app()

with app.app_context():
    db.create_all()
    print("✅ Tables created/verified")

    # Safe column migrations — add new columns without dropping existing data
    migrations = [
        ("user_profile", "stripe_customer_id", "VARCHAR(255)"),
        ("user_profile", "stripe_subscription_id", "VARCHAR(255)"),
    ]
    with db.engine.connect() as conn:
        for table, column, col_type in migrations:
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name=:t AND column_name=:c"
            ), {"t": table, "c": column})
            if not result.fetchone():
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                conn.commit()
                print(f"✅ Added column {table}.{column}")
            else:
                print(f"✔  Column {table}.{column} already exists")

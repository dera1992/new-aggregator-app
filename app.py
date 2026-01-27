import os
from flask import Flask
from models.models import db
from routes.news import news_bp # Import your new blueprint
from routes.auth import auth_bp
from routes.preferences import preferences_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    "DATABASE_URL",
    'postgresql://user:password@localhost/news_db'
)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", 'your_jwt_secret_key')
if os.getenv("TESTING") == "1":
    app.config["TESTING"] = True

# REGISTER BLUEPRINTS
app.register_blueprint(auth_bp)
app.register_blueprint(news_bp)
app.register_blueprint(preferences_bp)

db.init_app(app)

with app.app_context():
    db.create_all()  # Create tables if they don't exist
    if os.getenv("RUN_BACKGROUND_JOBS", "true").lower() == "true":
        from services.scheduler import start_background_jobs
        start_background_jobs(app) # Start the scraper/AI engine

# Your Routes (Login, Get News, etc.) go here...

if __name__ == '__main__':
    app.run(debug=False, port=8080) # debug=False is safer with schedulers

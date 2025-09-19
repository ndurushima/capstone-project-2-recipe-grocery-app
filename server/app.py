# app.py
from flask import Flask, jsonify, current_app
from flask_cors import CORS
from .extensions import db, bcrypt, migrate, jwt
from .config import Config

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS: app-wide, includes errors and OPTIONS
    CORS(
        app,
        resources={r"/*": {"origins": ALLOWED_ORIGINS}},
        supports_credentials=False,                 # True only if you actually use cookies
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Init extensions
    bcrypt.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Blueprints
    from .auth import auth_bp
    from .api import api_bp
    from . import models  # ensure models import registers tables

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp)

    @app.get("/")
    def health():
        return {"status": "ok"}

    # Optional: make 500s return JSON (CORS still applied by flask-cors)
    @app.errorhandler(500)
    def internal_error(e):
        current_app.logger.exception("Unhandled 500")
        return jsonify(error="INTERNAL_SERVER_ERROR"), 500

    return app

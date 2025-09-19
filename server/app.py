from flask import Flask, request
from flask_cors import CORS
from .extensions import db, bcrypt, migrate, jwt
from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]   


    @app.after_request
    def add_cors_headers(resp):
        origin = request.headers.get("Origin")
        if origin in [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]:
            resp.headers.setdefault("Access-Control-Allow-Origin", origin)
            resp.headers.setdefault("Vary", "Origin")
            resp.headers.setdefault("Access-Control-Allow-Headers", "Content-Type, Authorization")
            resp.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        return resp

    CORS(
        app,
        origins=ALLOWED_ORIGINS,
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )


    bcrypt.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)


    # Import and register blueprints
    from .auth import auth_bp
    from .api import api_bp
    from . import models

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp)


    @app.get("/")
    def health():
        return {"status": "ok"}


    return app

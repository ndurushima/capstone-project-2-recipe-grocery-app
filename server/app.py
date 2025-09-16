from flask import Flask
from flask_cors import CORS
from .extensions import db, bcrypt, migrate, jwt
from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)


    CORS(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}}, supports_credentials=True)


    bcrypt.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)


    # Import and register blueprints
    # from .auth import auth_bp
    # from .api import api_bp
    from . import models

    # app.register_blueprint(auth_bp, url_prefix="/auth")
    # app.register_blueprint(api_bp)


    @app.get("/")
    def health():
        return {"status": "ok"}


    return app

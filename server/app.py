from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from .config import Config


bcrypt = Bcrypt()
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)


    CORS(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}}, supports_credentials=True)


    bcrypt.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)


    # Import and register blueprints
    from .auth import auth_bp
    from .api import api_bp


    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp)


    @app.get("/")
    def health():
        return {"status": "ok"}


    return app
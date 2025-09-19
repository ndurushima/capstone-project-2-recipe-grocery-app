from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .extensions import db, bcrypt
from .models import User
from sqlalchemy.exc import IntegrityError


auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/signup")
def signup():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not email or not username or not password:
        return {"error": "Email, username, and password are required."}, 400
    
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return {"error": "Email or username already in use."}, 400
    
    try:
        user = User(email=email, username=username)
        user.password_hash = password
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "Email or username already in use."}, 409

    token = create_access_token(identity=user.id)
    return {"token": token, "user": user.to_dict()}, 201

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.authenticate(password):
        return {"error": "Invalid email or password."}, 401
    
    token = create_access_token(identity=user.id)
    return {"token": token, "user": user.to_dict()}, 200

@auth_bp.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get_or_404(uid)
    return user.dict(), 200
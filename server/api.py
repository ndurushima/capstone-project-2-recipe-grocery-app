from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import db
from .models import Recipe, MealPlan, MealItem, ShoppingItem, User
from .pagination import paginate


api_bp = Blueprint("api", __name__)


# -------- Recipes --------
@api_bp.get("/recipes")
@jwt_required()
def list_recipes():
    uid = get_jwt_identity()
    query = Recipe.query.filter_by(user_id=uid).order_by(Recipe.id.desc())
    return paginate(query, request)

@api_bp.post("/recipes")
@jwt_required()
def create_recipe():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    recipe = Recipe(user_id=uid, title=data.get("title", "Untitled"), ingredients=data.get("ingredients", ""), steps=data.get("steps"))
    db.session.add(recipe)
    db.session.commit()
    return recipe.to_dict(), 201

@api_bp.get("/recipes/<int:recipe_id>")
@jwt_required()
def get_recipe(recipe_id):
    uid = get_jwt_identity()
    recipe = Recipe.query.filter_by(id=recipe_id, user_id=uid).first_or_404()
    return recipe.to_dict(), 200

@api_bp.patch("/recipes/<int:recipe_id>")
@jwt_required()
def update_recipe(recipe_id):
    uid = get_jwt_identity()
    recipe = Recipe.query.filter_by(id=recipe_id, user_id=uid).first_or_404()
    data = request.get_json() or {}
    if "title" in data:
        recipe.title = data["title"]
    if "ingredients" in data:
        recipe.ingredients = data["ingredients"]
    if "steps" in data:
        recipe.steps = data["steps"]
    db.session.commit()
    return recipe.to_dict(), 200

# -------- Meal Plans --------
@api_bp.get("/meal_plans")
@jwt_required()
def list_meal_plans():
    uid = get_jwt_identity()
    q = MealPlan.query.filter_by(user_id=uid).order_by(MealPlan.week_start.desc())
    return paginate(q, request, serializer=lambda mp: mp.to_dict())


@api_bp.post("/meal_plans")
@jwt_required()
def create_meal_plan():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    week_start = data.get("week_start") # ISO date string
    mp = MealPlan(user_id=uid, week_start=week_start)
    db.session.add(mp)
    db.session.commit()
    return mp.to_dict(), 201


@api_bp.get("/meal_plans/<int:mpid>")
@jwt_required()
def get_meal_plan(mpid):
    uid = get_jwt_identity()
    mp = MealPlan.query.filter_by(id=mpid, user_id=uid).first_or_404()
    return mp.to_dict(include_items=True, include_shopping=True)


@api_bp.delete("/meal_plans/<int:mpid>")
@jwt_required()
def delete_meal_plan(mpid):
    uid = get_jwt_identity()
    mp = MealPlan.query.filter_by(id=mpid, user_id=uid).first_or_404()
    db.session.delete(mp)
    db.session.commit()
    return {"ok": True}
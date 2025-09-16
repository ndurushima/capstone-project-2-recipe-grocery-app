from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .extensions import db
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
    query = MealPlan.query.filter_by(user_id=uid).order_by(MealPlan.week_start.desc())
    return paginate(query, request, serializer=lambda meal_plan: meal_plan.to_dict())


@api_bp.post("/meal_plans")
@jwt_required()
def create_meal_plan():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    week_start = data.get("week_start") # ISO date string
    meal_plan = MealPlan(user_id=uid, week_start=week_start)
    db.session.add(meal_plan)
    db.session.commit()
    return meal_plan.to_dict(), 201


@api_bp.get("/meal_plans/<int:meal_plan_id>")
@jwt_required()
def get_meal_plan(meal_plan_id):
    uid = get_jwt_identity()
    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()
    return meal_plan.to_dict(include_items=True, include_shopping=True)


@api_bp.delete("/meal_plans/<int:meal_plan_id>")
@jwt_required()
def delete_meal_plan(meal_plan_id):
    uid = get_jwt_identity()
    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()
    db.session.delete(meal_plan)
    db.session.commit()
    return {"ok": True}


# -------- Meal Items --------
@api_bp.post("/meal_items")
@jwt_required()
def create_meal_item():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    meal_plan = MealPlan.query.filter_by(id=data.get("meal_plan_id"), user_id=uid).first_or_404()
    meal_item = MealItem(meal_plan_id=meal_plan.id, recipe_id=data.get("recipe_id"), day=data.get("day"), meal_type=data.get("meal_type"))
    db.session.add(meal_item)
    db.session.commit()
    return meal_item.to_dict(), 201


@api_bp.patch("/meal_items/<int:meal_item_id>")
@jwt_required()
def update_meal_item(miid):
    uid = get_jwt_identity()
    meal_item = MealItem.query.join(MealPlan).filter(MealItem.id==miid, MealPlan.user_id==uid).first_or_404()
    data = request.get_json() or {}
    if "recipe_id" in data:
        meal_item.recipe_id = data["recipe_id"]
    if "day" in data:
        meal_item.day = data["day"]
    if "meal_type" in data:
        meal_item.meal_type = data["meal_type"]
    db.session.commit()
    return meal_item.to_dict()


@api_bp.delete("/meal_items/<int:meal_item_id>")
@jwt_required()
def delete_meal_item(meal_item_id):
    uid = get_jwt_identity()
    meal_item = MealItem.query.join(MealPlan).filter(MealItem.id==meal_item_id, MealPlan.user_id==uid).first_or_404()
    db.session.delete(meal_item)
    db.session.commit()
    return {"ok": True}


# -------- Shopping Items --------
@api_bp.get("/shopping_items")
@jwt_required()
def list_shopping_items():
    uid = get_jwt_identity()
    meal_plan_id = request.args.get("meal_plan_id", type=int)
    query = ShoppingItem.query.join(MealPlan).filter(MealPlan.user_id==uid)
    if meal_plan_id:
        query = query.filter(ShoppingItem.meal_plan_id==meal_plan_id)
    return paginate(query, request)


@api_bp.post("/shopping_items")
@jwt_required()
def create_shopping_item():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    meal_plan = MealPlan.query.filter_by(id=data.get("meal_plan_id"), user_id=uid).first_or_404()
    shopping_item = ShoppingItem(meal_plan_id=meal_plan.id, name=data.get("name"), quantity=data.get("quantity"))
    db.session.add(shopping_item)
    db.session.commit()
    return shopping_item.to_dict(), 201


@api_bp.patch("/shopping_items/<int:shopping_item_id>")
@jwt_required()
def update_shopping_item(shopping_item_id):
    uid = get_jwt_identity()
    shopping_item = ShoppingItem.query.join(MealPlan).filter(ShoppingItem.id==shopping_item_id, MealPlan.user_id==uid).first_or_404()
    data = request.get_json() or {}
    if "name" in data:
        shopping_item.name = data["name"]
    if "quantity" in data:
        shopping_item.quantity = data["quantity"]
    if "checked" in data:
        shopping_item.checked = data["checked"]
    db.session.commit()
    return shopping_item.to_dict()


@api_bp.delete("/shopping_items/<int:shopping_item_id>")
@jwt_required()
def delete_shopping_item(shopping_item_id):
    uid = get_jwt_identity()
    shopping_item = ShoppingItem.query.join(MealPlan).filter(ShoppingItem.id==shopping_item_id, MealPlan.user_id==uid).first_or_404()
    db.session.delete(shopping_item)
    db.session.commit()
    return {"ok": True}


# ------- Utility: Generate Shopping List from Meal Plan -------
@api_bp.post("/meal_plans/<int:meal_plan_id>/generate_list")
@jwt_required()
def generate_list(meal_plan_id):
    uid = get_jwt_identity()
    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()

    # naive implementation: aggregate newline-separated ingredients from each recipe
    from collections import Counter
    bucket = Counter()

    for item in meal_plan.items:
        if item.recipe and item.recipe.ingredients:
            for line in item.recipe.ingredients.splitlines():
                name = line.strip()
                if name:
                    bucket[name] += 1


    # Upsert into ShoppingItem (simple: clear then insert)
    ShoppingItem.query.filter_by(meal_plan_id=meal_plan.id).delete()
    for name, count in bucket.items():
        shopping_item = ShoppingItem(meal_plan_id=meal_plan.id, name=name, quantity=str(count))
        db.session.add(shopping_item)
    db.session.commit()


    return meal_plan.to_dict(include_shopping=True)
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .extensions import db
from .models import Recipe, MealPlan, MealItem, ShoppingItem, User
from .pagination import paginate
import json
from datetime import date


api_bp = Blueprint("api", __name__)


# -------- Recipes --------
@api_bp.get("/recipes")
@jwt_required()
def list_recipes():
    uid = int(get_jwt_identity())
    query = Recipe.query.filter_by(user_id=uid).order_by(Recipe.id.desc())
    return paginate(query, request)

@api_bp.post("/recipes")
@jwt_required()
def create_recipe():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    recipe = Recipe(user_id=uid, title=data.get("title", "Untitled"), ingredients=data.get("ingredients", ""), steps=data.get("steps"))
    db.session.add(recipe)
    db.session.commit()
    return recipe.to_dict(), 201

@api_bp.get("/recipes/<int:recipe_id>")
@jwt_required()
def get_recipe(recipe_id):
    uid = int(get_jwt_identity())
    recipe = Recipe.query.filter_by(id=recipe_id, user_id=uid).first_or_404()
    return recipe.to_dict(), 200

@api_bp.patch("/recipes/<int:recipe_id>")
@jwt_required()
def update_recipe(recipe_id):
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
    query = MealPlan.query.filter_by(user_id=uid).order_by(MealPlan.week_start.desc())
    return paginate(query, request, serializer=lambda meal_plan: meal_plan.to_dict())


@api_bp.post("/meal_plans")
@jwt_required()
def create_meal_plan():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    week_start_s = data.get("week_start")  # "YYYY-MM-DD"
    if not week_start_s:
        return {"error": "week_start is required (YYYY-MM-DD)"}, 400
    try:
        week_start = date.fromisoformat(week_start_s)
    except ValueError:
        return {"error": "week_start must be YYYY-MM-DD"}, 400
    meal_plan = MealPlan(user_id=uid, week_start=week_start)
    db.session.add(meal_plan)
    db.session.commit()
    return meal_plan.to_dict(), 201


@api_bp.get("/meal_plans/<int:meal_plan_id>")
@jwt_required()
def get_meal_plan(meal_plan_id):
    uid = int(get_jwt_identity())
    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()
    return meal_plan.to_dict(include_items=True, include_shopping=True)


@api_bp.delete("/meal_plans/<int:meal_plan_id>")
@jwt_required()
def delete_meal_plan(meal_plan_id):
    uid = int(get_jwt_identity())
    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()
    db.session.delete(meal_plan)
    db.session.commit()
    return {"ok": True}


# -------- Meal Items --------
@api_bp.post("/meal_items")
@jwt_required()
def create_meal_item():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    meal_plan = MealPlan.query.filter_by(id=data.get("meal_plan_id"), user_id=uid).first_or_404()
    meal_item = MealItem(meal_plan_id=meal_plan.id, recipe_id=data.get("recipe_id"), day=data.get("day"), meal_type=data.get("meal_type"))
    db.session.add(meal_item)
    db.session.commit()
    return meal_item.to_dict(), 201


@api_bp.patch("/meal_items/<int:meal_item_id>")
@jwt_required()
def update_meal_item(meal_item_id):
    uid = int(get_jwt_identity())
    meal_item = MealItem.query.join(MealPlan).filter(MealItem.id==meal_item_id, MealPlan.user_id==uid).first_or_404()
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
    uid = int(get_jwt_identity())
    meal_item = MealItem.query.join(MealPlan).filter(MealItem.id==meal_item_id, MealPlan.user_id==uid).first_or_404()
    db.session.delete(meal_item)
    db.session.commit()
    return {"ok": True}


# -------- Shopping Items --------
@api_bp.get("/shopping_items")
@jwt_required()
def list_shopping_items():
    uid = int(get_jwt_identity())
    meal_plan_id = request.args.get("meal_plan_id", type=int)
    query = ShoppingItem.query.join(MealPlan).filter(MealPlan.user_id==uid)
    if meal_plan_id:
        query = query.filter(ShoppingItem.meal_plan_id==meal_plan_id)
    return paginate(query, request)


@api_bp.post("/shopping_items")
@jwt_required()
def create_shopping_item():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    meal_plan = MealPlan.query.filter_by(id=data.get("meal_plan_id"), user_id=uid).first_or_404()
    shopping_item = ShoppingItem(meal_plan_id=meal_plan.id, name=data.get("name"), quantity=data.get("quantity"))
    db.session.add(shopping_item)
    db.session.commit()
    return shopping_item.to_dict(), 201


@api_bp.patch("/shopping_items/<int:shopping_item_id>")
@jwt_required()
def update_shopping_item(shopping_item_id):
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
    shopping_item = ShoppingItem.query.join(MealPlan).filter(ShoppingItem.id==shopping_item_id, MealPlan.user_id==uid).first_or_404()
    db.session.delete(shopping_item)
    db.session.commit()
    return {"ok": True}


# ------- Utility: Generate Shopping List from Meal Plan -------
@api_bp.post("/meal_plans/<int:plan_id>/generate_shopping")
@jwt_required()
def generate_shopping(plan_id):
    meal_plan = MealPlan.query.get_or_404(plan_id)

    # collect ingredients
    items = []
    for mi in meal_plan.items:
        if mi.ingredient_snapshot:  # external recipe
            items.extend(json.loads(mi.ingredient_snapshot))
        elif mi.recipe:  # local recipe (legacy support)
            for line in mi.recipe.ingredients.splitlines():
                name = line.strip()
                if name:
                    items.append({"name": name, "quantity": ""})

    # dedupe
    dedup = {}
    for it in items:
        key = it["name"].strip().lower()
        if key in dedup:
            if it["quantity"]:
                dedup[key]["quantity"] = (
                    dedup[key]["quantity"] + " + " + it["quantity"]
                ).strip(" +")
        else:
            dedup[key] = {"name": it["name"], "quantity": it.get("quantity", "")}

    shopping = list(dedup.values())

    # clear old shopping items
    ShoppingItem.query.filter_by(meal_plan_id=plan_id).delete()

    # save new shopping items
    for it in shopping:
        db.session.add(
            ShoppingItem(
                meal_plan_id=plan_id,
                name=it["name"],
                quantity=it["quantity"],
            )
        )
    db.session.commit()

    return jsonify([s.to_dict() for s in meal_plan.shopping_items])

@api_bp.get("/recipes/search")
@jwt_required()
def recipes_search():
    from .recipes_api import search_recipes 
    from flask import current_app, request

    q = (request.args.get("q") or "").strip()
    page = max(1, int(request.args.get("page", 1) or 1))
    per = max(1, min(50, int(request.args.get("per_page", 10) or 10)))

    if not q:
        return {
            "items": [],
            "page": page,
            "per_page": per,
            "total": 0,
            "pages": 0,
        }, 200
    
    try:
        offset = (page - 1) * per
        data = search_recipes(q, offset=offset, number=per)
        return {
            "items": data["items"],
            "page": page,
            "per_page": per,
            "total": data["total"],
            "pages": (data["total"] + per - 1) // per,
        }, 200
    except Exception:
        current_app.logger.exception("recipes_search failed")
        return {
            "error": "SEARCH_UPSTREAM_ERROR",
            "message": "Failed to fetch recipes from provider.",
            "items": [],
            "page": page,
            "per_page": per,
            "total": 0,
            "pages": 0,
        }, 502


@api_bp.get("/recipes/<provider>/<external_id>")
@jwt_required()
def recipe_detail(provider, external_id):
    from .recipes_api import get_recipe_detail
    raw = get_recipe_detail(external_id)

    # Normalize common fields
    title = raw.get("title") or raw.get("name") or ""
    image = raw.get("image") or raw.get("imageUrl")

    # Ingredients: prefer our canonical [{name, quantity}]
    ingredients = raw.get("ingredients")
    if ingredients is None and "extendedIngredients" in raw:
        ingredients = [
            {
                "name": (i.get("originalName") or i.get("name") or "").strip(),
                "quantity": (i.get("original") or "").strip(),
            }
            for i in (raw.get("extendedIngredients") or [])
        ]

    # Steps: support multiple upstream shapes
    steps = raw.get("steps") or raw.get("instructions")
    if not steps and isinstance(raw.get("analyzedInstructions"), list):
        collected = []
        for block in raw["analyzedInstructions"]:
            for s in block.get("steps", []):
                if s.get("step"):
                    collected.append(s["step"])
        steps = "\n\n".join(collected)

    return {
        "title": title,
        "image": image,
        "ingredients": ingredients or [],
        "steps": steps or "",
    }, 200

@api_bp.post("/meal_items/external")
@jwt_required()
def add_external_meal_item():
    from .recipes_api import get_recipe_detail 
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    meal_plan_id = data.get("meal_plan_id")

    meal_plan = MealPlan.query.filter_by(id=meal_plan_id, user_id=uid).first_or_404()
    
    day = data.get("day")
    meal_type = data.get("meal_type")
    provider = data.get("provider") or "spoonacular"
    external_id = str(data.get("external_id"))

    # fetch details and snapshot ingredients
    detail = get_recipe_detail(external_id)
    snapshot = json.dumps(detail["ingredients"])  # store list of {name,quantity}

    mi = MealItem(
        meal_plan_id=meal_plan.id,
        day=day,
        meal_type=meal_type,
        external_provider=provider,
        external_id=external_id,
        external_title=detail["title"],
        external_image=detail.get("image"),
        ingredient_snapshot=snapshot,
    )
    db.session.add(mi)
    db.session.commit()
    return mi.to_dict(), 201
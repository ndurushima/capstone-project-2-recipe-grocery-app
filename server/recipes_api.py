# server/recipes_api.py
import os, requests

PROVIDER = os.getenv("RECIPE_PROVIDER", "spoonacular")
SPOON_KEY = os.getenv("SPOONACULAR_API_KEY")

BASE = "https://api.spoonacular.com"

def search_recipes(query, offset=0, number=10):
    # Spoonacular example
    params = {
        "apiKey": SPOON_KEY,
        "query": query,
        "offset": offset,
        "number": number,
        "addRecipeInformation": True,
    }
    r = requests.get(f"{BASE}/recipes/complexSearch", params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    # Normalize to a common shape
    items = []
    for it in data.get("results", []):
        items.append({
            "provider": "spoonacular",
            "external_id": str(it["id"]),
            "title": it.get("title"),
            "image": it.get("image"),
        })
    return {"items": items, "total": data.get("totalResults", 0)}

def get_recipe_detail(external_id):
    params = {"apiKey": SPOON_KEY, "includeNutrition": False}
    r = requests.get(f"{BASE}/recipes/{external_id}/information", params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    # Extract ingredients as simple strings + measures
    ingredients = []
    for ing in data.get("extendedIngredients", []):
        name = ing.get("nameClean") or ing.get("name") or ""
        amount = f'{ing.get("amount","")} {ing.get("unit","")}'.strip()
        ingredients.append({"name": name, "quantity": amount})
    return {
        "provider": "spoonacular",
        "external_id": str(data["id"]),
        "title": data.get("title"),
        "image": data.get("image"),
        "ingredients": ingredients,
        "sourceUrl": data.get("sourceUrl"),
    }

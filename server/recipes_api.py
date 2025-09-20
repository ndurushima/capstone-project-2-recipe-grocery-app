# server/recipes_api.py
import os
import re
import requests

SPOONACULAR_KEY = (
    os.getenv("SPOONACULAR_API_KEY")
    or os.getenv("SPOONACULAR_KEY")
)

def require_key():
    if not SPOONACULAR_KEY:
        raise RuntimeError(
            "Spoonacular API key not set. Define SPOONACULAR_KEY or SPOONACULAR_API_KEY in the server environment."
        )

def _strip_html(s: str) -> str:
    if not isinstance(s, str):
        return ""
    return re.sub(r"<[^>]+>", "", s)

BASE = "https://api.spoonacular.com"

def search_recipes(query, offset=0, number=10):
    require_key()
    params = {
        "apiKey": SPOONACULAR_KEY,
        "query": query,
        "offset": offset,
        "number": number,
        "addRecipeInformation": True,
    }
    r = requests.get(f"{BASE}/recipes/complexSearch", params=params, timeout=10)
    if not r.ok:
        raise RuntimeError(f"Upstream {r.status_code}: {r.text[:300]}")
    data = r.json()
    items = []
    for it in data.get("results", []):
        items.append({
            "provider": "spoonacular",
            "external_id": str(it["id"]),
            "title": it.get("title"),
            "image": it.get("image"),
        })
    return {"items": items, "total": data.get("totalResults", 0)}

def get_recipe_detail(external_id: str):
    require_key()
    url = f"{BASE}/recipes/{external_id}/information"
    resp = requests.get(
        url,
        params={"apiKey": SPOONACULAR_KEY, "includeNutrition": "false"},
        timeout=15,
    )
    if not resp.ok:
        raise RuntimeError(f"Upstream {resp.status_code}: {resp.text[:300]}")
    data = resp.json()

    title = data.get("title") or ""
    image = data.get("image")

    # Ingredients -> canonical list of {name, quantity}
    ingredients = []
    for ing in data.get("extendedIngredients", []) or []:
        name = (ing.get("originalName") or ing.get("name") or "").strip()
        qty = (ing.get("original") or "").strip()
        if name or qty:
            ingredients.append({"name": name or qty, "quantity": qty})

    # Instructions: try 'instructions' first, then flatten 'analyzedInstructions'
    instructions = _strip_html(data.get("instructions") or "")
    if not instructions and isinstance(data.get("analyzedInstructions"), list):
        steps = []
        for block in data["analyzedInstructions"]:
            for s in block.get("steps", []) or []:
                if s.get("step"):
                    steps.append(s["step"])
        if steps:
            instructions = "\n\n".join(steps)

    return {
        "title": title,
        "image": image,
        "ingredients": ingredients,
        "instructions": instructions,
        "analyzedInstructions": data.get("analyzedInstructions") or [],
        "sourceUrl": data.get("sourceUrl"),
    }

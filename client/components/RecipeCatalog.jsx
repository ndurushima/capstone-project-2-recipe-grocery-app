import { useEffect, useState } from "react";
import { api } from "../api";

export default function RecipeCatalog() {
    const [recipes, setRecipes] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    async function load(p = 1) {
        const data = await api.get(`recipes?page=${p}&per_page=10`).json();
        setRecipes(data.items);
        setPage(data.page);
        setTotal(data.total);
    }

    useEffect(() => { load(1); }, []);

    async function createRecipe(e) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const body = {
            title: form.get("title"),
            ingredients: form.get("ingredients"),
            steps: form.get("steps"),
        };
        await api.post("recipes", { json: body }).json();
        e.currentTarget.reset();
        load(1);
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Recipes</h2>

            <form onSubmit={createRecipe} style={{ display: "grid", gap: 8, maxWidth: 600 }}>
                <input name="title" placeholder="Title" required />
                <textarea name="ingredients" placeholder="One ingredient per line" rows={4} />
                <textarea name="steps" placeholder="Steps…" rows={4} />
                <button>Add Recipe</button>
            </form>

            <ul>
                {recipes.map(r => (
                    <li key={r.id}>
                        <strong>{r.title}</strong>
                        <pre style={{ whiteSpace: "pre-wrap" }}>{r.ingredients}</pre>
                    </li>
                ))}
            </ul>

            <div style={{ display: "flex", gap: 8}}>
                <button disabled={page<=1} onClick={() => load(page-1)}>Prev</button>
                <span>Page {page} / {Math.max(1, Math.ceil(total/10))}</span>
                <button disabled={page*10>=total} onClick={() => load(page+1)}>Next</button>
            </div>
        </div>
    );
}
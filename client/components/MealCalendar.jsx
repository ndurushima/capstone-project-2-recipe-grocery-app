import React from "react";
import { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function MealCalendar() {
    const [plans, setPlans] = useState([]);
    const [active, setActive] = useState(null);

    async function loadPlans() {
        const data = await api.get("meal_plans").json();
        setPlans(data.items);
        if (!active && data.items[0]) setActive(data.items[0]);
    }

    useEffect(() => { loadPlans(); }, []);

    async function createPlan(e) {
        e.preventDefault();
        const week_start = new FormData(e.currentTarget).get("week_start");
        const mp = await api.post("meal_plans", { json: { week_start } }).json();
        setPlans(p => [mp, ...p]);
        setActive(mp);
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Meal Plan</h2>
            <form onSubmit={createPlan}>
                <input type="date" name="week_start" required />
                <button>Create</button>
            </form>
            
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {plans.map(p => (
                    <button key={p.id} onClick={() => setActive(p)}>
                        {p.week_start}
                    </button>
                ))}
            </div>
            {active && <PlanGrid mealPlanId={active.id} />}
        </div>
    );
}

function PlanGrid({ mealPlanId }) {
    const [items, setItems] = useState([]);
    const [recipes, setRecipes] = useState([]);

    async function load() {
        const mp = await api.get(`meal_plans/${mealPlanId}`).json();
        setItems(mp.items || []);
        const recs = await api.get("recipes?per_page=100").json();
        setRecipes(recs.items || []);
    }
    useEffect(() => { load(); }, [mealPlanId]);

    async function add(day, meal_type, recipe_id) {
        const mi = await api.post("meal_items", { json: { meal_plan_id: mealPlanId, day, meal_type, recipe_id } }).json();
        setItems(prev => [...prev, mi]);
    }

    async function generateList() {
        await api.post(`meal_plans/${mealPlanId}/generate_list`).json();
        alert("Shopping list generated!");
    }

    return (
        <div style={{ marginTop: 16 }}>
            <button onClick={generateList}>Generate Shopping List</button>
            <table style={{ width: "100%", marginTop: 12 }}>
                <thead>
                    <tr>
                        <th>Day</th>
                        {TYPES.map(t => <th key={t}>{t}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {DAYS.map(d => (
                        <tr key={d}>
                            <td>{d}</td>
                            {TYPES.map(t => (
                                <td key={t}>
                                    <MealCell day={d} type={t} items={items.filter(i => i.day===d && i.meal_type===t)} recipes={recipes} onAdd={add} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function MealCell({ day, type, items, recipes, onAdd }) {
  return (
    <div>
      <ul>
        {items.map(i => (
          <li key={i.id}>{i.title || "(no recipe)"}</li>
        ))}
      </ul>

      <select
        onChange={e => e.target.value && onAdd(day, type, Number(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>Add recipe...</option>
        {recipes.map(r => (
          <option key={r.id} value={r.id}>{r.title}</option>
        ))}
      </select>
    </div>
  );
}

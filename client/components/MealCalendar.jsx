import React, { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function MealCalendar({ planId }) {
  const [plan, setPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load current plan (with items) and the user's local recipes
  async function loadPlan() {
    const data = await api.get(`meal_plans/${planId}`).json();
    setPlan(data);
  }
  async function loadRecipes() {
    const data = await api.get("recipes", {
      searchParams: { page: 1, per_page: 100 },
    }).json();
    setRecipes(data.items || []);
  }

  useEffect(() => {
    if (!planId) return; 
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadPlan(), loadRecipes()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [planId]);

  // This is what the cell calls. It adds a *local* recipe to the plan.
  const onAdd = async (day, mealType, recipeId) => {
    try {
      await api.post("meal_items", {
        json: {
          meal_plan_id: Number(planId),
          recipe_id: Number(recipeId),
          day,
          meal_type: mealType,
        },
      }).json();
      // Refresh so the newly added item appears immediately
      await loadPlan();
    } catch (err) {
      let msg = "Failed to add recipe.";
      try {
        const body = await err.response?.json();
        if (body?.error || body?.message) {
          msg += ` ${body.error ?? ""} ${body.message ?? ""}`.trim();
        }
      } catch {}
      console.error("Add recipe failed:", err);
      alert(msg);
    }
  };

  if (loading || !plan) {
    return <div style={{ padding: 16 }}>Loading plan…</div>;
  }

  // Helper to grab items for a specific cell
  const itemsForCell = (day, type) =>
    (plan.items || []).filter((i) => i.day === day && i.meal_type === type);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h2>Meal Plan for week starting {plan.week_start}</h2>

      {/* Simple grid: rows = meal types, columns = days */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)`,
          gap: 8,
          alignItems: "start",
        }}
      >
        {/* Header row */}
        <div />
        {DAYS.map((d) => (
          <div key={`hdr-${d}`} style={{ fontWeight: 600, textAlign: "center" }}>
            {d}
          </div>
        ))}

        {/* Body */}
        {MEAL_TYPES.map((mt) => (
          <React.Fragment key={`row-${mt}`}>
            <div style={{ fontWeight: 600 }}>{mt}</div>
            {DAYS.map((d) => (
              <MealCell
                key={`cell-${d}-${mt}`}
                day={d}
                type={mt}
                items={itemsForCell(d, mt)}
                recipes={recipes}
                onAdd={onAdd}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Cell component: shows items + a dropdown to add a local recipe */
function MealCell({ day, type, items, recipes, onAdd }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const v = e.target.value;
    if (!v) return;
    setSaving(true);
    try {
      await onAdd(day, type, Number(v));
    } finally {
      setValue(""); // reset dropdown back to placeholder
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 8 }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((i) => {
          const title =
            i.title || i.external_title || i.recipe?.title || "(no recipe)";
        // If you want, add a small delete button here using your DELETE /meal_items/:id route
          return <li key={i.id}>{title}</li>;
        })}
      </ul>

      <select
        value={value}
        onChange={handleChange}
        disabled={saving || recipes.length === 0}
        style={{ marginTop: 6, width: "100%" }}
      >
        <option value="" disabled>
          {saving ? "Adding…" : "Add recipe..."}
        </option>
        {recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </select>
    </div>
  );
}

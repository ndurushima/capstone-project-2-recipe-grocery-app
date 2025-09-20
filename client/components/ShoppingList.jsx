// src/pages/ShoppingList.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [activePlanId, setActivePlanId] = useState(0);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load plans (pick the first as active)
  useEffect(() => {
    (async () => {
      setLoadingPlans(true);
      try {
        const list = await api.get("meal_plans", { searchParams: { page: 1, per_page: 50 } }).json();
        const rows = list.items || [];
        setPlans(rows);
        if (rows[0]) setActivePlanId(rows[0].id);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  // Load shopping items for the active plan
  async function loadItems(planId) {
    if (!planId) return;
    setLoadingItems(true);
    try {
      const data = await api.get("shopping_items", {
        searchParams: { meal_plan_id: planId, per_page: 100 },
      }).json();
      setItems(data.items || []);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => { loadItems(activePlanId); }, [activePlanId]);

  // Toggle checkbox
  async function toggle(id, checked) {
    const updated = await api.patch(`shopping_items/${id}`, { json: { checked } }).json();
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
  }

  // 🔸 Generate shopping list (calls your POST /meal_plans/:id/generate_shopping)
  async function generate() {
    if (!activePlanId) return;
    setGenerating(true);
    try {
      await api.post(`meal_plans/${activePlanId}/generate_shopping`).json();
      await loadItems(activePlanId); // refresh with generated items
    } catch (err) {
      let msg = "Failed to generate shopping list.";
      try {
        const body = await err.response?.json();
        if (body?.error || body?.message) {
          msg += ` ${body.error ?? ""} ${body.message ?? ""}`.trim();
        }
      } catch {}
      console.error("generate_shopping failed:", err);
      alert(msg);
    } finally {
      setGenerating(false);
    }
  }

  const planLabel = (p) => p.week_start || p.week_Start || `Plan ${p.id}`;

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h2>Shopping List</h2>

      {/* Plan picker + generate button */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Meal Plan:</label>
        <select
          disabled={loadingPlans || plans.length === 0}
          value={activePlanId}
          onChange={e => setActivePlanId(Number(e.target.value))}
        >
          {plans.map(p => (
            <option key={p.id} value={p.id}>{planLabel(p)}</option>
          ))}
        </select>

        <button
          onClick={generate}
          disabled={!activePlanId || generating || loadingPlans}
          title="Build list from current plan items"
        >
          {generating ? "Generating…" : "Generate Shopping List"}
        </button>
      </div>

      {/* Items */}
      {loadingItems ? (
        <div>Loading items…</div>
      ) : items.length === 0 ? (
        <div>No shopping items yet. Click “Generate Shopping List”.</div>
      ) : (
        <ul>
          {items.map(i => (
            <li key={i.id}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!i.checked}
                  onChange={e => toggle(i.id, e.target.checked)}
                />
                <span>
                  {i.name}
                  {i.quantity ? ` x${i.quantity}` : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

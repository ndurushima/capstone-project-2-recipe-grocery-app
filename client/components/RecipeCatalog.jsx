import React, { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function RecipeCatalog() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [per] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // selection to place a found recipe onto a plan
  const [planId, setPlanId] = useState(""); // user types their meal_plan_id
  const [day, setDay] = useState(DAYS[0]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]); // default dinner
  const pages = Math.max(1, Math.ceil(total / per));

  async function load(p = 1) {
    setLoading(true);
    try {
      const data = await api
        .get("recipes/search", {
          searchParams: { q: term || "", page: p, per_page: per },
        })
        .json();
      setResults(data.items || []);
      setPage(data.page || p);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial empty search (or auto-run a default like "chicken")
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmitSearch(e) {
    e.preventDefault();
    load(1);
  }

  async function addToPlan(r) {
    if (!planId) {
      alert("Enter a meal_plan_id first.");
      return;
    }
    try {
      await api.post("meal_items/external", {
        json: {
          meal_plan_id: Number(planId),
          day,
          meal_type: mealType,
          provider: r.provider || "spoonacular",
          external_id: r.external_id,
        },
      }).json();
      alert(`Added "${r.title}" to plan ${planId} (${day} ${mealType})`);
    } catch (err) {
      console.error(err);
      alert("Failed to add to plan. Check console/server logs.");
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2>Find Recipes</h2>

      {/* Placement controls */}
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          alignItems: "end",
          maxWidth: 720,
        }}
      >
        <label style={{ display: "grid", gap: 4 }}>
          <span>Meal Plan ID</span>
          <input
            placeholder="e.g. 1"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Day</span>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Meal Type</span>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Search box */}
      <form onSubmit={onSubmitSearch} style={{ display: "flex", gap: 8, maxWidth: 720 }}>
        <input
          placeholder="Search (e.g., chicken, pasta, tofu)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Results */}
      {loading && <div>Loading…</div>}
      {!loading && results.length === 0 && <div>No results.</div>}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {results.map((r) => (
          <div
            key={`${r.provider || "spoonacular"}:${r.external_id}`}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 8,
            }}
          >
            {r.image ? (
              <img
                src={r.image}
                alt={r.title}
                style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }}
              />
            ) : null}
            <div style={{ fontWeight: 600 }}>{r.title}</div>
            <button onClick={() => addToPlan(r)}>Add to Meal Plan</button>
          </div>
        ))}
      </div>

      {/* Pager */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button disabled={page >= pages || loading} onClick={() => load(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

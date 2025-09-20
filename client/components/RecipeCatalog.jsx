// src/components/RecipeCatalog.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../toast/ToastContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function RecipeCatalog() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [per] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [didSearch, setDidSearch] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const { push } = useToast();

  const [planId, setPlanId] = useState("");
  const [day, setDay] = useState(DAYS[0]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]);
  const pages = Math.max(1, Math.ceil(total / per));

  const navigate = useNavigate();

  function detailHref(r) {
    // External results have provider/external_id. Local results (from /recipes) have id.
    if (r.external_id != null) {
      const provider = r.provider || "spoonacular";
      return `/recipe/external/${provider}/${r.external_id}`;
    }
    if (r.id != null) {
      return `/recipe/local/${r.id}`;
    }
    return null;
  }

  async function load(p = 1) {
    setLoading(true);
    try {
      const hasQuery = term.trim().length > 0;
      const searchParams = {
        page: p,
        per_page: per,
        ...(hasQuery ? { q: term.trim() } : {}),
      };
      const endpoint = hasQuery ? "recipes/search" : "recipes";
      const data = await api.get(endpoint, { searchParams }).json();
      setResults(data.items || []);
      setPage(data.page || p);
      setTotal(Number.isFinite(data.total) ? data.total : 0);
    } catch (e) {
      console.error("Failed to load recipes:", e);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmitSearch(e) {
    e.preventDefault();
    setDidSearch(true);
    setPage(1);
    load(1);
  }

  async function addToPlan(r) {
    if (!planId) {
      push("Enter a meal_plan_id first.", { type: "error" });
      return;
    }
    try {
      setAddingId(`${r.provider || "spoonacular"}:${r.external_id}`);
      await api
        .post("meal_items/external", {
          json: {
            meal_plan_id: Number(planId),
            day,
            meal_type: mealType,
            provider: r.provider || "spoonacular",
            external_id: r.external_id,
          },
        })
        .json();
      push(`Added "${r.title}" to plan ${planId} (${day} ${mealType})`, {
        type: "success",
      });
    } catch (err) {
      console.error(err);
      let msg = "Failed to add to plan.";
      try {
        const body = await err.response?.json();
        if (body?.error || body?.message)
          msg += ` ${body.error ?? ""} ${body.message ?? ""}`.trim();
      } catch {}
      push(msg, { type: "error" });
    } finally {
      setAddingId(null);
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
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
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
        {results.map((r) => {
          const key =
            r.external_id != null
              ? `ext:${r.provider || "spoonacular"}:${r.external_id}`
              : `local:${r.id}`;

          return (
            <div
              key={key}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              {/* Single, clickable image */}
              {r.image ? (
                <div
                  role="button"
                  onClick={() => {
                    const href = detailHref(r);
                    if (href) navigate(href);
                  }}
                  title="View recipe"
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={r.image}
                    alt={r.title}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                    loading="lazy"
                    onError={(e) => e.currentTarget.remove()}
                  />
                </div>
              ) : null}

              {/* Clickable title */}
              <div
                style={{ fontWeight: 600, cursor: "pointer" }}
                onClick={() => {
                  const href = detailHref(r);
                  if (href) navigate(href);
                }}
                title="View recipe"
              >
                {r.title}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    const href = detailHref(r);
                    if (href) navigate(href);
                  }}
                  title="View details"
                >
                  View
                </button>

                <button
                  onClick={() => addToPlan(r)}
                  disabled={addingId === `${r.provider || "spoonacular"}:${r.external_id}`}
                >
                  {addingId === `${r.provider || "spoonacular"}:${r.external_id}`
                    ? "Adding…"
                    : "Add to Meal Plan"}
                </button>
              </div>
            </div>
          );
        })}
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
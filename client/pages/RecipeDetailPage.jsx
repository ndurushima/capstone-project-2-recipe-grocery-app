// src/pages/RecipeDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../toast/ToastContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

function Section({ title, children }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

export default function RecipeDetailPage() {
  // Two route shapes:
  //   /recipe/external/:provider/:externalId
  //   /recipe/local/:id
  const params = useParams();
  const isExternal = !!params.provider && !!params.externalId;
  const provider = params.provider;
  const externalId = params.externalId;
  const recipeId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Add-to-plan controls
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");
  const [day, setDay] = useState(DAYS[0]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]); // dinner
  const [saving, setSaving] = useState(false);

  const { push } = useToast();
  const title = data?.title || data?.external_title || "Recipe";

  // Load recipe details
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let detail;
        if (isExternal) {
          // Expected from server: { title, image, ingredients:[{name,quantity}], steps?, sourceUrl? }
          detail = await api.get(`recipes/${provider}/${externalId}`).json();
        } else {
          // Local: { id, title, ingredients (string), steps (string) }
          detail = await api.get(`recipes/${recipeId}`).json();
        }
        setData(detail);
      } catch (e) {
        console.error(e);
        try {
          const body = await e.response?.json();
          setErr(body?.message || "Could not load recipe details.");
        } catch {
          setErr("Could not load recipe details.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isExternal, provider, externalId, recipeId]);

  // Load meal plans (pick newest/default first)
  useEffect(() => {
    (async () => {
      try {
        const list = await api.get("meal_plans", { searchParams: { page: 1, per_page: 50 } }).json();
        const rows = list.items || [];
        setPlans(rows);
        if (!planId && rows[0]) setPlanId(rows[0].id);
      } catch (e) {
        console.error("Failed to load plans for add-to-plan panel:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ingredients render
  const renderIngredients = useMemo(() => {
    if (!data) return null;

    // External: array of { name, quantity }
    if (Array.isArray(data.ingredients)) {
      const items = data.ingredients
        .map((it) => {
          const name = (it?.name || "").trim();
          const qty = (it?.quantity || "").trim();
          if (!name && !qty) return null;
          return qty && name ? `${qty} — ${name}` : (name || qty);
        })
        .filter(Boolean);

      if (items.length === 0) return <em>No ingredients available.</em>;
      return (
        <ul>
          {items.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      );
    }

    // Local: newline-separated string
    if (typeof data.ingredients === "string") {
      const lines = data.ingredients
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length === 0) return <em>No ingredients.</em>;
      return (
        <ul>
          {lines.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      );
    }

    return <em>No ingredients.</em>;
  }, [data]);

  // Steps render with robust fallbacks
  const renderSteps = useMemo(() => {
    if (!data) return null;

    let stepsText = "";
    if (Array.isArray(data.steps)) {
      stepsText = data.steps.join("\n");
    } else if (typeof data.steps === "string") {
      stepsText = data.steps;
    } else if (typeof data.instructions === "string") {
      stepsText = data.instructions;
    } else if (Array.isArray(data.analyzedInstructions)) {
      const collected = [];
      for (const block of data.analyzedInstructions) {
        for (const s of block.steps || []) {
          if (s?.step) collected.push(s.step);
        }
      }
      if (collected.length) stepsText = collected.join("\n\n");
    }

    if (!stepsText.trim()) return <em>No instructions provided.</em>;

    const paras = stepsText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return (
      <ol style={{ paddingLeft: 18 }}>
        {paras.map((p, i) => (
          <li key={i} style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {p}
          </li>
        ))}
      </ol>
    );
  }, [data]);

   async function addToPlan() {
    if (!planId) {
      push("Please choose a meal plan.", { type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (isExternal) {
        await api.post("meal_items/external", {
          json: {
            meal_plan_id: Number(planId),
            day,
            meal_type: mealType,
            provider: provider || "spoonacular",
            external_id: externalId,
          },
        }).json();
      } else {
        await api.post("meal_items", {
          json: {
            meal_plan_id: Number(planId),
            recipe_id: Number(recipeId),
            day,
            meal_type: mealType,
          },
        }).json();
      }
      push(`Added "${title}" to plan ${planId} (${day} ${mealType})`, { type: "success" });
    } catch (err) {
      console.error(err);
      let msg = "Failed to add to plan.";
      try {
        const body = await err.response?.json();
        if (body?.error || body?.message) msg += ` ${body.error ?? ""} ${body.message ?? ""}`.trim();
      } catch {}
      push(msg, { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading recipe…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  if (!data) return null;

  const planLabel = (p) => p.week_start || p.week_Start || `Plan ${p.id}`;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>

      {data.image && (
        <img
          src={data.image}
          alt={title}
          style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8 }}
        />
      )}

      {data.sourceUrl && (
        <div>
          <a href={data.sourceUrl} target="_blank" rel="noreferrer">Original source</a>
        </div>
      )}

      {/* Add-to-plan panel */}
      <Section title="Add to Meal Plan">
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            alignItems: "end",
            maxWidth: 900,
          }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            <span>Meal Plan</span>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={plans.length === 0 || saving}
            >
              {plans.length === 0 ? (
                <option value="">(No plans found)</option>
              ) : (
                plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {planLabel(p)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>Day</span>
            <select value={day} onChange={(e) => setDay(e.target.value)} disabled={saving}>
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
              disabled={saving}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <div>
            <button onClick={addToPlan} disabled={saving || !planId}>
              {saving ? "Adding…" : "Add to Meal Plan"}
            </button>
            {!!planId && (
              <Link to={`/plans/${planId}`} style={{ marginLeft: 8 }}>
                View Plan
              </Link>
            )}
          </div>
        </div>
      </Section>

      <Section title="Ingredients">{renderIngredients}</Section>
      <Section title="Instructions">{renderSteps}</Section>
    </div>
  );
}

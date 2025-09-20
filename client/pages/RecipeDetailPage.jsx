import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

function Section({ title, children }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

export default function RecipeDetailPage() {
  const params = useParams();
  const isExternal = !!params.provider && !!params.externalId;
  const recipeId = params.id;
  const provider = params.provider;
  const externalId = params.externalId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const title = data?.title || data?.external_title || "Recipe";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let detail;
        if (isExternal) {
          detail = await api.get(`recipes/${provider}/${externalId}`).json();
        } else {
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

  const renderSteps = useMemo(() => {
    if (!data) return null;

    // Prefer server-normalized 'steps'; then fall back to 'instructions';
    // finally, flatten 'analyzedInstructions' if present.
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

    // Split into paragraphs by blank lines
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

  if (loading) return <div style={{ padding: 16 }}>Loading recipe…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  if (!data) return null;

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

      <Section title="Ingredients">
        {renderIngredients}
      </Section>

      <Section title="Instructions">
        {renderSteps}
      </Section>
    </div>
  );
}

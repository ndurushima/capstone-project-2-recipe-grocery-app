import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function mondayYYYYMMDD(d = new Date()) {
  const day = d.getDay();           // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, "0");
  const dd = String(mon.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function PlansIndex() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await api.get("meal_plans", { searchParams: { page: 1, per_page: 50 } }).json();
        const plans = list.items || [];
        if (plans.length > 0) {
          nav(`/plans/${plans[0].id}`, { replace: true });
          return;
        }
        // no plans? create one for this week
        const week_start = mondayYYYYMMDD();
        const created = await api.post("meal_plans", { json: { week_start } }).json();
        nav(`/plans/${created.id}`, { replace: true });
      } catch (e) {
        console.error(e);
        setErr("Could not load or create a meal plan.");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  if (loading) return <div style={{ padding: 16 }}>Loading plan…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  return null;
}

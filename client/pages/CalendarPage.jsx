import React, { useEffect, useState } from "react";
import { api } from "../api";
import MealCalendar from "../components/MealCalendar";

function mondayYYYYMMDD(d = new Date()) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, "0");
  const dd = String(mon.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function CalendarPage() {
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Grab the first plan (newest) or create one if none exist
        const list = await api.get("meal_plans", {
          searchParams: { page: 1, per_page: 1 },
        }).json();
        if (list.items?.length) {
          setPlanId(list.items[0].id);
        } else {
          const created = await api.post("meal_plans", {
            json: { week_start: mondayYYYYMMDD() },
          }).json();
          setPlanId(created.id);
        }
      } catch (e) {
        console.error(e);
        setErr("Could not load or create a meal plan.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading plan…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  return <MealCalendar planId={planId} />;
}

import { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES = ["breakfast", "lumch", "dinner", "snack"];

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


import { useEffect, useState } from "react";
import { api } from "../api";


export default function ShoppingList() {
    const [items, setItems] = useState([]);
    const [activePlanId, setActivePlanId] = useState(0);
    const [plans, setPlans] = useState([]);

    useEffect(() => { (async () => {
        const list = await api.get("meal_plans").json();
        setPlans(list.items);
        if (list.items[0]) setActivePlanId(list.items[0].id);
    })(); }, []);

    useEffect(() => { (async () => {
        if (!activePlanId) return;
        const data = await api.get(`shopping_items?meal_plan_id=${activePlanId}&per_page=100`).json();
        setItems(data.items);
    })();}, [activePlanId]);

    async function toggle(id, checked) {
        const updated = await api.patch(`shopping_items/${id}`, { json: { checked } }).json();
        setItems(prev => prev.map(i => i.id===id ? updated : i));
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Shopping List</h2>
            <div style={{ marginBottom: 8 }}>
                <label>Meal Plan: </label>
                <select value={activePlanId} onChange={e => setActivePlanId(Number(e.target.value))}>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.week_start}</option>)}
                </select>
            </div>

            <ul>
                {items.map(i => (
                    <li key={i.id}>
                        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input type="checkbox" checked={i.checked} onChange={e => toggle(i.id, e.target.checked)} />
                            <span>{i.name}{i.quantity ? ` x${i.quantity}` : ""}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
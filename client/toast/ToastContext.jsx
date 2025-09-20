import React, { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, { type = "info", duration = 3000 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, message, type, duration };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div style={{
        position: "fixed", top: 12, right: 12, display: "grid", gap: 8, zIndex: 9999,
        maxWidth: 360
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#fee2e2" :
                        t.type === "success" ? "#dcfce7" : "#eef2ff",
            border: "1px solid #e5e7eb",
            borderLeft: `4px solid ${t.type === "error" ? "#ef4444" :
                                     t.type === "success" ? "#22c55e" : "#6366f1"}`,
            borderRadius: 6,
            padding: "10px 12px",
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
            fontSize: 14
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

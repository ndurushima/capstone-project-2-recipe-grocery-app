import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import RecipeCatalog from "./components/RecipeCatalog.jsx";
import ShoppingList from "./components/ShoppingList.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import PlanPage from "./pages/PlanPage.jsx";
import PlansIndex from "./pages/PlansIndex.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import ToastProvider from "./toast/ToastContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <ToastProvider>
      <header style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #eee" }}>
        <Link to="/">Recipes</Link>
        <Link to="/calendar">Meal Plan</Link>
        <Link to="/shopping">Shopping</Link>
        <span style={{ marginLeft: "auto" }}>
          {user ? (
            <>
              <span>Hi, {user.username}</span>
              <button onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup" style={{ marginLeft: 8 }}>Signup</Link>
            </>
          )}
        </span>
      </header>

      <Routes>
        <Route path="/" element={<PrivateRoute><RecipeCatalog /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
        <Route path="/shopping" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Optional deep links */}
        <Route path="/plans" element={<PrivateRoute><PlansIndex /></PrivateRoute>} />
        <Route path="/plans/:id" element={<PrivateRoute><PlanPage /></PrivateRoute>} />
      </Routes>
    </ToastProvider>
  );
}

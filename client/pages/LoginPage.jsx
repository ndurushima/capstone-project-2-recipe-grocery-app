import React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [ error, setError ] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        try {
            await login(form.get("email"), form.get("password"));
            nav("/");
        } catch(err) {
            setError("Invalid credentials");
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Login</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
                {error && <div style={{ color: "red" }}>{error}</div>}
                <input name="email" placeholder="email" />
                <input name="password" type="password" placeholder="password" />
                <button>Login</button>
            </form>
            <p>Need an account? <Link to="/signup">Signup</Link></p>
        </div>
    );
}
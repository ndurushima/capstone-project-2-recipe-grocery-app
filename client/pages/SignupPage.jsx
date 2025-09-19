import React from "react";
import { useNavigate } from "react-router-dom";
import {useAuth } from "../AuthContext";

export default function SignupPage() {
    const { signup } = useAuth();
    const nav = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await signup(f.get("email"), f.get("username"), f.get("password"));
        nav("/");
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Signup</h2>
            <form onSubmit={onSubmit} stype={{ display: "grid", gap: 8, maxWidth: 360 }}>
                <input name="email" placeholder="email" />
                <input name="username" placeholder="username" />
                <input name="password" type="password" placeholder="password" />
                <button>Create account</button>
            </form>
        </div>
    );
}
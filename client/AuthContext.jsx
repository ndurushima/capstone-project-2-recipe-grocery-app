import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";


const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);


export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("token");
            if (!token) { setUser(null); setLoading(false); return; }
            try {
                const me = await api.get("auth/me").json();
                setUser(me);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);


    const login = async (email, password) => {
        const data = await api.post("auth/login", { json: { email, password } }).json();
        const token = data.token || data.access_token;
        if (!token) throw new Error("No token returned");
        localStorage.setItem("token", token);
        try {
            const me = await api.get("auth/me").json();
            setUser(me);
        } catch {
            setUser(data.user ?? null);
        }
    };


    const signup = async (email, username, password) => {
        const data = await api.post("auth/signup", { json: { email, username, password } }).json();
        const token = data.token || data.access_token;
        if (!token) throw new Error("No token returned");
        localStorage.setItem("token", token);
        try {
            const me = await api.get("me").json();
            setUser(me);
        } catch {
            setUser(data.user ?? null);
        }
    };


    const logout = () => { localStorage.removeItem("token"); setUser(null); };


    return (
        <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}
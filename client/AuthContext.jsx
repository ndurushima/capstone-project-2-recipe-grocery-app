import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";


const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);


export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function load() {
            try {
                const me = await api.get("auth/me").json();
                setUser(me);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);


    const login = async (email, password) => {
        const data = await api.post("auth/login", { json: { email, password } }).json();
        localStorage.setItem("token", data.token);
        setUser(data.user);
    };


    const signup = async (email, username, password) => {
        const data = await api.post("auth/signup", { json: { email, username, password } }).json();
        localStorage.setItem("token", data.token);
        setUser(data.user);
    };


    const logout = () => { localStorage.removeItem("token"); setUser(null); };


    return (
        <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}
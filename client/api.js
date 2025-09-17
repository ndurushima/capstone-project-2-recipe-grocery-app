import ky from "ky";


const API_BASE = "http://localhost:5555";


export const api = ky.create({
    prefixUrl: API_BASE,
    hooks: {
        beforeRequest: [request => {
            const token = localStorage.getItem("token");
            if (token) request.headers.set("Authorization", `Bearer ${token}`);
        }]
    }
});
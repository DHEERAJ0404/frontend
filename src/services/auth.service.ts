import api from "./api.ts";
import type { UserRole, AuthResponse } from "../types/index.ts";

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/signin", { email, password });
    if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
};

export const register = async (name: string, email: string, password: string, role: UserRole) => {
    return api.post("/auth/signup", {
        name,
        email,
        password,
        role,
    });
};

export const getCurrentUser = (): AuthResponse | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
};

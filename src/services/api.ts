import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8082/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
            config.headers.set("Authorization", `Bearer ${token}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: on 401, clear stale token and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stale/invalid auth data and redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        // 403 = authenticated but wrong role — let the calling code handle it
        return Promise.reject(error);
    }
);

export default api;

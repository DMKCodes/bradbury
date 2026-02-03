/**
 * serverApi.js
 *
 * Minimal fetch wrapper for the mobile app.
 *
 * - Explicit and safe.
 * - Handle JSON errors and propagate friendly error message.
 * - Attach Bearer token when available.
 */

import { getApiBaseUrl } from "./serverConfig";
import { getToken, setToken, clearToken } from "./serverAuth";

const apiFetch = async (path, { method = "GET", body, skipAuth = false } = {}) => {
    const baseUrl = await getApiBaseUrl();

    const headers = {
        "Content-Type": "application/json",
    };

    if (!skipAuth) {
        const token = await getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const msg = data?.detail || data?.error || `http_${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
};

const healthCheck = async () => {
    const baseUrl = await getApiBaseUrl();
    const root = baseUrl.replace(/\/api\/v1\/?$/, "");

    const res = await fetch(`${root}/health`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const err = new Error(data?.detail || data?.error || `http_${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
};

const me = async () => {
    return apiFetch("/auth/me", { method: "GET" });
};

const register = async ({ email, password }) => {
    return apiFetch("/auth/register", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
    });
};

const login = async ({ email, password }) => {
    const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
    });

    if (data?.token) {
        await setToken(data.token);
    }

    return data;
};

const logout = async () => {
    await clearToken();
};

const listEntries = async ({ dayKey } = {}) => {
    const params = new URLSearchParams();
    if (dayKey) params.set("dayKey", String(dayKey));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/entries${qs}`, { method: "GET" });
};

const listTopics = async () => {
    return apiFetch("/topics", { method: "GET" });
};

export {
    apiFetch,
    healthCheck,
    me,
    register,
    login,
    logout,
    listEntries,
    listTopics,
};
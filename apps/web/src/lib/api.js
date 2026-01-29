const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => {
    return localStorage.getItem("bradbury_token") || "";
};

const setToken = (token) => {
    if (!token) {
        localStorage.removeItem("bradbury_token");
        return;
    }
    localStorage.setItem("bradbury_token", token);
};

const apiFetch = async (path, { method = "GET", body } = {}) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
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

const login = async ({ email, password }) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    if (data?.token) setToken(data.token);
    return data;
};

const register = async ({ email, password }) => {
    return apiFetch("/auth/register", { method: "POST", body: { email, password } });
};

const me = async () => {
    return apiFetch("/auth/me", { method: "GET" });
};

const logout = () => {
    setToken("");
};

const listEntries = async ({ dayKey } = {}) => {
    const params = new URLSearchParams();
    if (dayKey) params.set("dayKey", String(dayKey));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/entries${qs}`, { method: "GET" });
};

const upsertEntry = async (payload) => {
    return apiFetch("/entries/upsert", { method: "POST", body: payload });
};

const listTopics = async () => {
    return apiFetch("/topics", { method: "GET" });
};

const createTopic = async ({ name } = {}) => {
    return apiFetch("/topics", { method: "POST", body: { name } });
};

const getTopic = async (topicId) => {
    return apiFetch(`/topics/${encodeURIComponent(String(topicId))}`, { method: "GET" });
};

const addTopicItem = async (topicId, payload) => {
    return apiFetch(`/topics/${encodeURIComponent(String(topicId))}/items`, { method: "POST", body: payload });
};

const toggleTopicItemFinished = async (topicId, itemId) => {
    return apiFetch(
        `/topics/${encodeURIComponent(String(topicId))}/items/${encodeURIComponent(String(itemId))}/toggle`,
        { method: "POST" }
    );
};

const deleteTopicItem = async (topicId, itemId) => {
    return apiFetch(`/topics/${encodeURIComponent(String(topicId))}/items/${encodeURIComponent(String(itemId))}`, { method: "DELETE" });
};

/**
 * getStats
 *
 * Server-backed stats. Computation done server-side for performance/scalability.
 *
 * API:
 *   GET /stats?year=All|YYYY
 */
const getStats = async ({ year = "All" } = {}) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/stats${qs}`, { method: "GET" });
};

export {
    apiFetch,
    login,
    register,
    me,
    logout,
    getToken,
    setToken,
    listEntries,
    upsertEntry,
    listTopics,
    createTopic,
    getTopic,
    addTopicItem,
    toggleTopicItemFinished,
    deleteTopicItem,
    getStats,
};
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "bradbury_token_v1";
const USER_KEY = "bradbury_user_v1";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

const authStorage = {
    async getToken() {
        return AsyncStorage.getItem(TOKEN_KEY);
    },
    async setToken(token) {
        if (!token) return AsyncStorage.removeItem(TOKEN_KEY);
        return AsyncStorage.setItem(TOKEN_KEY, token);
    },
    async getUser() {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },
    async setUser(user) {
        if (!user) return AsyncStorage.removeItem(USER_KEY);
        return AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    async clear() {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    },
};

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    const token = await authStorage.getToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const unwrap = (res) => res.data;

// --- Auth ---
const login = async (username, password) => {
    const data = await api.post("/auth/login", { username, password }).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "login_failed");

    await authStorage.setToken(data.token);
    await authStorage.setUser(data.user);

    return data.user;
};

const me = async () => {
    const data = await api.get("/auth/me").then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "me_failed");

    await authStorage.setUser(data.user);
    return data.user;
};

const logout = async () => {
    await authStorage.clear();
};

// --- Entries ---
const listEntries = async (params = {}) => {
    const data = await api.get("/entries", { params }).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "entries_list_failed");
    return data.items || [];
};

const createEntry = async (payload) => {
    const data = await api.post("/entries", payload).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "entries_create_failed");
    return data.item;
};

const updateEntry = async (id, patch) => {
    const data = await api.put(`/entries/${id}`, patch).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "entries_update_failed");
    return data.item;
};

const deleteEntry = async (id) => {
    const data = await api.delete(`/entries/${id}`).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "entries_delete_failed");
    return true;
};

// --- Stats ---
const getStatsSummary = async (params = {}) => {
    const data = await api.get("/stats/summary", { params }).then(unwrap);
    if (!data?.ok) throw new Error(data?.error || "stats_failed");
    return data;
};

export {
    api,
    authStorage,
    login,
    me,
    logout,
    listEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getStatsSummary,
};

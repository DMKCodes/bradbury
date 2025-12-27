// Central API client for web app.
// - Store tokens in localStorage
// - Add Authorization: Bearer <token> automatically
// - Expose helper methods for routes

import axios from "axios";

const TOKEN_KEY = "bradbury_token_v1";
const USER_KEY = "bradbury_user_v1";

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (!user) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "",
    timeout: 15000,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrap(res) {
  return res.data;
}

// --- Auth ---
export async function login(username, password) {
  const data = await api.post("/auth/login", { username, password }).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "login_failed");
  authStorage.setToken(data.token);
  authStorage.setUser(data.user);
  return data.user;
}

export async function me() {
  const data = await api.get("/auth/me").then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "me_failed");
  authStorage.setUser(data.user);
  return data.user;
}

export function logout() {
  authStorage.clear();
}

// --- Entries ---
export async function listEntries(params = {}) {
  const data = await api.get("/entries", { params }).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "entries_list_failed");
  return data.items || [];
}

export async function createEntry(payload) {
  const data = await api.post("/entries", payload).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "entries_create_failed");
  return data.item;
}

export async function updateEntry(id, patch) {
  const data = await api.put(`/entries/${id}`, patch).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "entries_update_failed");
  return data.item;
}

export async function deleteEntry(id) {
  const data = await api.delete(`/entries/${id}`).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "entries_delete_failed");
  return true;
}

// --- Stats ---
export async function getStatsSummary(params = {}) {
  const data = await api.get("/stats/summary", { params }).then(unwrap);
  if (!data?.ok) throw new Error(data?.error || "stats_failed");
  return data;
}
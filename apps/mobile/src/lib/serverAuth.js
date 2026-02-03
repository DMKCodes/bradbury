/**
 * serverAuth.js
 *
 * Token storage + helpers for authenticated API calls.
 *
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_AUTH_TOKEN = "bb_auth_token_v1";

const getToken = async () => {
    const t = await AsyncStorage.getItem(KEY_AUTH_TOKEN);
    return String(t || "").trim();
};

const setToken = async (token) => {
    const safe = String(token || "").trim();
    if (!safe) {
        await AsyncStorage.removeItem(KEY_AUTH_TOKEN);
        return;
    }
    await AsyncStorage.setItem(KEY_AUTH_TOKEN, safe);
};

const clearToken = async () => {
    await AsyncStorage.removeItem(KEY_AUTH_TOKEN);
};

export {
    KEY_AUTH_TOKEN,
    getToken,
    setToken,
    clearToken,
};
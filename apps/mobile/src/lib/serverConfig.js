/**
 * serverConfig.js
 *
 * Stores/loads the API base URL for the mobile app.
 *
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY_API_BASE_URL = "bb_api_base_url_v1";

const getDefaultApiBaseUrl = () => {
    if (Platform.OS === "android") {
        return "http://10.0.2.2:4000/api/v1";
    }

    return "http://localhost:4000/api/v1";
};

const getApiBaseUrl = async () => {
    const raw = await AsyncStorage.getItem(KEY_API_BASE_URL);
    const saved = String(raw || "").trim();
    return saved || getDefaultApiBaseUrl();
};

const setApiBaseUrl = async (url) => {
    const safe = String(url || "").trim();

    if (!safe) {
        // Clearing returns to default behavior
        await AsyncStorage.removeItem(KEY_API_BASE_URL);
        return { ok: true, cleared: true };
    }

    await AsyncStorage.setItem(KEY_API_BASE_URL, safe);
    return { ok: true, cleared: false };
};

export {
    KEY_API_BASE_URL,
    getDefaultApiBaseUrl,
    getApiBaseUrl,
    setApiBaseUrl,
};
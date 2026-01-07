import AsyncStorage from "@react-native-async-storage/async-storage";

const BRADBURY_PREFIX = "bradbury_";

const listBradburyKeys = async () => {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter((k) => String(k).startsWith(BRADBURY_PREFIX));
};

const exportBradburyData = async () => {
    const targetKeys = await listBradburyKeys();
    const pairs = await AsyncStorage.multiGet(targetKeys);

    const data = {};
    for (const [k, v] of pairs) {
        data[k] = v;
    }

    return {
        exportedAt: new Date().toISOString(),
        prefix: BRADBURY_PREFIX,
        keys: targetKeys,
        data,
        version: 1,
    };
};

const validateImportPayload = (payload) => {
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "Import payload is not an object." };
    }

    const prefix = String(payload.prefix || BRADBURY_PREFIX);

    const data = payload.data;
    if (!data || typeof data !== "object") {
        return { ok: false, error: "Import payload is missing a 'data' object." };
    }

    const entries = Object.entries(data);

    const filtered = entries
        .filter(([k]) => String(k).startsWith(prefix))
        .map(([k, v]) => [String(k), v === null || v === undefined ? null : String(v)]);

    if (filtered.length === 0) {
        return { ok: false, error: `No keys found with prefix "${prefix}".` };
    }

    for (const [k, v] of filtered) {
        if (typeof k !== "string") {
            return { ok: false, error: "Invalid key type in import payload." };
        }
        if (v !== null && typeof v !== "string") {
            return { ok: false, error: `Invalid value type for key "${k}". Expected string.` };
        }
    }

    return { ok: true, prefix, pairs: filtered };
};

const importBradburyData = async ({
    json,
    mode = "merge",
    requirePrefix = BRADBURY_PREFIX,
}) => {
    let parsed;
    try {
        parsed = JSON.parse(String(json || ""));
    } catch {
        return { ok: false, error: "Invalid JSON. Unable to parse." };
    }

    const validation = validateImportPayload({
        ...parsed,
        prefix: parsed?.prefix ?? requirePrefix,
    });

    if (!validation.ok) {
        return { ok: false, error: validation.error };
    }

    const pairs = validation.pairs;

    if (mode === "replace") {
        const existing = await listBradburyKeys();
        await AsyncStorage.multiRemove(existing);
    }

    const toSet = pairs.filter(([, v]) => v !== null);
    const toRemove = pairs.filter(([, v]) => v === null).map(([k]) => k);

    if (toSet.length > 0) {
        await AsyncStorage.multiSet(toSet);
    }

    if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
    }

    return { ok: true, imported: pairs.length, set: toSet.length, removed: toRemove.length };
};

const clearBradburyData = async () => {
    const targetKeys = await listBradburyKeys();
    await AsyncStorage.multiRemove(targetKeys);
    return { ok: true, deleted: targetKeys.length };
};

export {
    BRADBURY_PREFIX,
    exportBradburyData,
    importBradburyData,
    clearBradburyData,
};
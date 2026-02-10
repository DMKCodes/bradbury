/**
 * store.js
 *
 * Local entries store (AsyncStorage).
 *
 * Phase 1:
 * - Add replaceAllEntries(entries) to support "hydrate from server" (Settings action).
 *
 * Phase 3A:
 * - Add mergeEntriesFromServer(entries) to support "pull latest (merge)".
 *
 * Merge rule:
 * - Identity key is (dayKey, category).
 * - Winner is the record with the highest updatedAt (latest wins).
 * - If updatedAt is missing, treat as 0 (older).
 * - Does NOT delete local entries that do not exist on server.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_ENTRIES = "bradbury_entries_v1";

const safeParse = (raw, fallback) => {
    try {
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const uniq = (arr) => {
    const out = [];
    const seen = new Set();
    for (const x of arr) {
        const s = String(x).trim();
        if (!s) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
};

const normalizeCategory = (c) => {
    const s = String(c || "").trim().toLowerCase();
    if (s === "essay" || s === "story" || s === "poem") return s;
    throw new Error("invalid_category");
};

const safeInt = (v) => {
    const n = Number.parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
};

const clampRating = (v) => {
    const n = Number.parseInt(String(v), 10);
    if (!Number.isFinite(n)) return 5;
    if (n < 1) return 1;
    if (n > 5) return 5;
    return n;
};

const getNYParts = () => {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const parts = dtf.formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type)?.value;

    const year = get("year");
    const month = get("month");
    const day = get("day");

    return { year, month, day };
};

const getTodayDayKeyNY = () => {
    const { year, month, day } = getNYParts();
    return `${year}-${month}-${day}`;
};

const readAll = async () => {
    const raw = await AsyncStorage.getItem(KEY_ENTRIES);
    const payload = safeParse(raw, null);

    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.entries)) {
        return payload.entries;
    }

    // Backward compatibility with older shapes (if they exist).
    if (payload && payload.byProfile && typeof payload.byProfile === "object") {
        const values = Object.values(payload.byProfile);
        for (const v of values) {
            if (Array.isArray(v?.entries)) return v.entries;
            if (Array.isArray(v)) return v;
        }
    }

    if (payload && payload.profiles && typeof payload.profiles === "object") {
        const values = Object.values(payload.profiles);
        for (const v of values) {
            if (Array.isArray(v?.entries)) return v.entries;
            if (Array.isArray(v)) return v;
        }
    }

    return [];
};

const writeAll = async (entries) => {
    await AsyncStorage.setItem(KEY_ENTRIES, JSON.stringify({ entries }));
};

/**
 * replaceAllEntries
 *
 * - Used by server hydration to overwrite local entries.
 * - Simple write into existing storage key.
 * - Does NOT validate every field (serverHydrate normalizes).
 * - Keeps persisted shape identical to what app expects.
 */
const replaceAllEntries = async (entries) => {
    const safe = Array.isArray(entries) ? entries : [];
    await writeAll(safe);
    return { ok: true, count: safe.length };
};

const entryKey = (e) => {
    const dayKey = String(e?.dayKey || "").trim();
    const category = String(e?.category || "").trim();
    return `${dayKey}__${category}`;
};

const toMillis = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const mergeOneEntry = (localEntry, serverEntry) => {
    // Both entries are expected to be normalized-ish.
    const localUpdated = toMillis(localEntry?.updatedAt);
    const serverUpdated = toMillis(serverEntry?.updatedAt);

    // Latest updatedAt wins. If equal, prefer server to avoid stale server write-back.
    if (serverUpdated >= localUpdated) {
        return {
            ...localEntry,
            ...serverEntry,
            createdAt: localEntry?.createdAt ?? serverEntry?.createdAt ?? Date.now(),
            updatedAt: serverUpdated || localUpdated || Date.now(),
        };
    }

    return {
        ...serverEntry,
        ...localEntry,
        createdAt: serverEntry?.createdAt ?? localEntry?.createdAt ?? Date.now(),
        updatedAt: localUpdated || serverUpdated || Date.now(),
    };
};

/**
 * mergeEntriesFromServer
 *
 * Merge rule:
 * - key: (dayKey, category)
 * - keep local entries that don't exist on server
 * - for collisions: latest updatedAt wins
 *
 * Returns counts for UI.
 */
const mergeEntriesFromServer = async (serverEntries) => {
    const safeServer = Array.isArray(serverEntries) ? serverEntries : [];
    const local = await readAll();

    const localMap = new Map();
    for (const e of local) {
        const k = entryKey(e);
        if (!k || k === "__") continue;
        localMap.set(k, e);
    }

    let added = 0;
    let updated = 0;

    for (const se of safeServer) {
        const k = entryKey(se);
        if (!k || k === "__") continue;

        const existing = localMap.get(k);
        if (!existing) {
            localMap.set(k, se);
            added += 1;
            continue;
        }

        const merged = mergeOneEntry(existing, se);
        const prevUpdated = toMillis(existing?.updatedAt);
        const nextUpdated = toMillis(merged?.updatedAt);

        localMap.set(k, merged);

        // Count as updated if the merged record differs by updatedAt or title (coarse but useful)
        if (nextUpdated !== prevUpdated || String(merged?.title || "") !== String(existing?.title || "")) {
            updated += 1;
        }
    }

    const mergedList = Array.from(localMap.values());

    await writeAll(mergedList);

    return { ok: true, added, updated, total: mergedList.length };
};

const listEntries = async ({ dayKey } = {}) => {
    const all = await readAll();
    if (!dayKey) return all;

    return all.filter((e) => String(e.dayKey) === String(dayKey));
};

const upsertEntryForDayCategory = async ({
    dayKey,
    category,
    title,
    author = "",
    notes = "",
    tags = [],
    rating = 5,
    wordCount = "",
}) => {
    const cat = normalizeCategory(category);
    const safeDayKey = String(dayKey || "").trim();
    if (!safeDayKey) throw new Error("missing_dayKey");

    const safeTitle = String(title || "").trim();
    if (!safeTitle) throw new Error("missing_title");

    const year = String(safeDayKey).slice(0, 4);
    const baseTags = Array.isArray(tags) ? tags : [];
    const enrichedTags = uniq([
        ...baseTags,
        `year:${year}`,
        `type:${cat}`,
    ]);

    const wc = safeInt(wordCount);
    const r = clampRating(rating);

    const now = Date.now();

    const all = await readAll();

    const idx = all.findIndex((e) => String(e.dayKey) === safeDayKey && String(e.category) === cat);

    const nextEntry = {
        dayKey: safeDayKey,
        category: cat,
        title: safeTitle,
        author: String(author || "").trim(),
        notes: String(notes || "").trim(),
        tags: enrichedTags,
        rating: r,
        wordCount: wc == null ? null : wc,
        updatedAt: now,
    };

    if (idx >= 0) {
        const prev = all[idx];
        all[idx] = {
            ...prev,
            ...nextEntry,
            createdAt: prev?.createdAt ?? now,
        };
    } else {
        all.push({
            ...nextEntry,
            createdAt: now,
        });
    }

    await writeAll(all);

    return { ok: true };
};

const deleteEntryForDayCategory = async ({ dayKey, category }) => {
    const cat = normalizeCategory(category);
    const safeDayKey = String(dayKey || "").trim();
    if (!safeDayKey) throw new Error("missing_dayKey");

    const all = await readAll();
    const next = all.filter((e) => !(String(e.dayKey) === safeDayKey && String(e.category) === cat));

    await writeAll(next);

    return { ok: true };
};

export {
    KEY_ENTRIES,
    getTodayDayKeyNY,
    listEntries,
    upsertEntryForDayCategory,
    deleteEntryForDayCategory,
    replaceAllEntries,
    mergeEntriesFromServer,
};
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
    PROFILES: "bradbury_profiles_v1",
    CURRENT_PROFILE_ID: "bradbury_current_profile_id_v1",
    ENTRIES: "bradbury_entries_v1",
};

const DEFAULT_PROFILES = [
    { id: "doug", displayName: "Doug" },
    { id: "caroline", displayName: "Caroline" },
];

const CATEGORY_ORDER = ["essay", "story", "poem"];

const CONTENT_TYPES = ["essay", "short_story", "poem", "book"];

const nowIso = () => new Date().toISOString();

const makeId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const readJson = async (key, fallback) => {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;

    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    const cleaned = tags
        .map((t) => String(t || "").trim().toLowerCase())
        .filter(Boolean);

    return Array.from(new Set(cleaned));
};

const includesText = (haystack, needle) => {
    if (!needle) return true;
    return String(haystack || "").toLowerCase().includes(String(needle).toLowerCase());
};

const dayKeyAddDays = (dayKey, deltaDays) => {
    const [y, m, d] = String(dayKey).split("-").map((n) => Number(n));
    const ms = Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000;
    const dt = new Date(ms);

    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
};

const APP_TIMEZONE = "America/New_York";

const getTodayDayKeyNY = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
};

const getYearFromDayKey = (dayKey) => {
    const s = String(dayKey || "");
    if (s.length >= 4) return s.slice(0, 4);
    return String(new Date().getFullYear());
};

const contentTypeFromCategory = (category) => {
    if (category === "story") return "short_story";
    if (category === "essay") return "essay";
    if (category === "poem") return "poem";
    // For future use
    if (category === "book") return "book";
    return "essay";
};

const ensureSystemTags = ({ tags, dayKey, category }) => {
    const year = getYearFromDayKey(dayKey);
    const type = contentTypeFromCategory(category);

    const base = normalizeTags(tags);

    const system = [`year:${year}`, `type:${type}`];

    return normalizeTags([...base, ...system]);
};

const ensureInitialized = async () => {
    const profiles = await readJson(KEYS.PROFILES, null);
    if (!profiles) {
        await writeJson(KEYS.PROFILES, DEFAULT_PROFILES);
    }

    const entries = await readJson(KEYS.ENTRIES, null);
    if (!entries) {
        await writeJson(KEYS.ENTRIES, []);
    }
};

const getProfiles = async () => {
    await ensureInitialized();
    return readJson(KEYS.PROFILES, DEFAULT_PROFILES);
};

const getCurrentProfileId = async () => {
    await ensureInitialized();
    return AsyncStorage.getItem(KEYS.CURRENT_PROFILE_ID);
};

const setCurrentProfileId = async (profileId) => {
    await ensureInitialized();
    if (!profileId) {
        await AsyncStorage.removeItem(KEYS.CURRENT_PROFILE_ID);
        return;
    }
    await AsyncStorage.setItem(KEYS.CURRENT_PROFILE_ID, String(profileId));
};

const getCurrentProfile = async () => {
    const profiles = await getProfiles();
    const id = await getCurrentProfileId();
    if (!id) return null;
    return profiles.find((p) => p.id === id) || null;
};

const listEntries = async (params = {}) => {
    await ensureInitialized();

    const {
        profileId,
        dayKey,
        from,
        to,
        category,
        tag,
        search,
        minRating,
        limit,
    } = params;

    const entries = await readJson(KEYS.ENTRIES, []);

    const pId = profileId || (await getCurrentProfileId());
    const tagLower = tag ? String(tag).trim().toLowerCase() : "";
    const minR = minRating ? Number(minRating) : null;

    const filtered = entries
        .filter((e) => {
            if (pId && e.profileId !== pId) return false;

            if (dayKey && e.dayKey !== dayKey) return false;

            if (from && e.dayKey < from) return false;
            if (to && e.dayKey > to) return false;

            if (category && e.category !== category) return false;

            if (tagLower) {
                const tags = Array.isArray(e.tags) ? e.tags : [];
                if (!tags.includes(tagLower)) return false;
            }

            if (minR != null && Number.isFinite(minR)) {
                if (Number(e.rating || 0) < minR) return false;
            }

            if (search && String(search).trim()) {
                const s = String(search).trim();
                const ok =
                    includesText(e.title, s) ||
                    includesText(e.author, s) ||
                    includesText(e.notes, s);
                if (!ok) return false;
            }

            return true;
        })
        .sort((a, b) => {
            if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? 1 : -1;

            const ai = CATEGORY_ORDER.indexOf(a.category);
            const bi = CATEGORY_ORDER.indexOf(b.category);
            return ai - bi;
        });

    if (limit && Number.isFinite(Number(limit))) {
        return filtered.slice(0, Number(limit));
    }

    return filtered;
};

const upsertEntryForDayCategory = async (payload) => {
    await ensureInitialized();

    const pId = payload.profileId || (await getCurrentProfileId());
    if (!pId) throw new Error("missing_profile");

    const dayKey = String(payload.dayKey || "").trim();
    const category = String(payload.category || "").trim();

    if (!dayKey) throw new Error("dayKey_required");
    if (!["essay", "story", "poem"].includes(category)) throw new Error("invalid_category");

    const title = String(payload.title || "").trim();
    if (!title) throw new Error("title_required");

    const rating = Number(payload.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("invalid_rating");

    const wordCount =
        payload.wordCount === null || payload.wordCount === undefined || payload.wordCount === ""
            ? null
            : Number.parseInt(String(payload.wordCount), 10);

    const safeWordCount =
        wordCount == null || !Number.isFinite(wordCount) || wordCount < 0 ? null : wordCount;

    const entries = await readJson(KEYS.ENTRIES, []);

    const idx = entries.findIndex(
        (e) => e.profileId === pId && e.dayKey === dayKey && e.category === category
    );

    const safeTags = ensureSystemTags({
        tags: payload.tags || [],
        dayKey,
        category,
    });

    const base = {
        profileId: pId,
        dayKey,
        category,
        title,
        author: String(payload.author || "").trim(),
        notes: String(payload.notes || ""),
        tags: safeTags,
        rating,
        wordCount: safeWordCount,
    };

    let next;
    if (idx >= 0) {
        const prev = entries[idx];
        next = {
            ...prev,
            ...base,
            updatedAt: nowIso(),
        };
        entries[idx] = next;
    } else {
        next = {
            id: makeId(),
            ...base,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        entries.push(next);
    }

    await writeJson(KEYS.ENTRIES, entries);
    return next;
};

const deleteEntryById = async (id) => {
    await ensureInitialized();
    const entries = await readJson(KEYS.ENTRIES, []);
    const next = entries.filter((e) => e.id !== id);
    await writeJson(KEYS.ENTRIES, next);
    return true;
};

const deleteEntryForDayCategory = async ({ dayKey, category, profileId }) => {
    await ensureInitialized();

    const pId = profileId || (await getCurrentProfileId());
    if (!pId) throw new Error("missing_profile");

    const entries = await readJson(KEYS.ENTRIES, []);
    const next = entries.filter(
        (e) => !(e.profileId === pId && e.dayKey === dayKey && e.category === category)
    );
    await writeJson(KEYS.ENTRIES, next);
    return true;
};

const computeBadges = (streakDays) => {
    const thresholds = [
        { n: 3, key: "streak_3", label: "3-day streak", description: "3 complete days in a row." },
        { n: 7, key: "streak_7", label: "7-day streak", description: "A full week of complete days." },
        { n: 14, key: "streak_14", label: "14-day streak", description: "Two weeks strong." },
        { n: 30, key: "streak_30", label: "30-day streak", description: "A month of consistency." },
        { n: 60, key: "streak_60", label: "60-day streak", description: "Two months." },
        { n: 100, key: "streak_100", label: "100-day streak", description: "Triple digits." },
    ];

    return thresholds.filter((t) => streakDays >= t.n);
};

const computeStatsForEntries = (entries) => {
    const totals = {
        entriesCount: 0,
        totalWords: 0,
        averageRating: null,
    };

    const byType = {
        essay: { entriesCount: 0, totalWords: 0, avgRating: null },
        short_story: { entriesCount: 0, totalWords: 0, avgRating: null },
        poem: { entriesCount: 0, totalWords: 0, avgRating: null },
        book: { entriesCount: 0, totalWords: 0, avgRating: null },
    };

    let ratingSum = 0;

    const typeRatingSum = {
        essay: 0,
        short_story: 0,
        poem: 0,
        book: 0,
    };

    for (const e of entries) {
        totals.entriesCount += 1;

        const wc = e.wordCount != null ? Number(e.wordCount) : 0;
        totals.totalWords += wc;

        const r = Number(e.rating || 0);
        ratingSum += r;

        const t = contentTypeFromCategory(e.category);
        if (byType[t]) {
            byType[t].entriesCount += 1;
            byType[t].totalWords += wc;
            typeRatingSum[t] += r;
        }
    }

    if (totals.entriesCount > 0) {
        totals.averageRating = ratingSum / totals.entriesCount;
    }

    for (const t of CONTENT_TYPES) {
        const count = byType[t].entriesCount;
        if (count > 0) {
            byType[t].avgRating = typeRatingSum[t] / count;
        }
    }

    return { totals, byType };
};

const getStatsSummary = async ({ profileId } = {}) => {
    await ensureInitialized();

    const pId = profileId || (await getCurrentProfileId());
    if (!pId) throw new Error("missing_profile");

    const allEntries = await listEntries({ profileId: pId });

    const yearsSet = new Set();
    for (const e of allEntries) {
        yearsSet.add(getYearFromDayKey(e.dayKey));
    }

    const availableYears = Array.from(yearsSet).sort((a, b) => (a < b ? 1 : -1));

    const globalStats = computeStatsForEntries(allEntries);

    const byYear = {};
    for (const y of availableYears) {
        const yearEntries = allEntries.filter((e) => getYearFromDayKey(e.dayKey) === y);
        byYear[y] = computeStatsForEntries(yearEntries);
    }

    // Streak: consecutive complete days up to today
    const dayToCats = new Map();
    for (const e of allEntries) {
        if (!dayToCats.has(e.dayKey)) dayToCats.set(e.dayKey, new Set());
        dayToCats.get(e.dayKey).add(e.category);
    }

    const isCompleteDay = (dayKey) => {
        const cats = dayToCats.get(dayKey);
        if (!cats) return false;
        return cats.has("essay") && cats.has("story") && cats.has("poem");
    };

    let streak = 0;
    let cursor = getTodayDayKeyNY();
    while (isCompleteDay(cursor)) {
        streak += 1;
        cursor = dayKeyAddDays(cursor, -1);
    }

    const badges = computeBadges(streak);

    return {
        ok: true,
        availableYears,
        global: globalStats,
        byYear,
        streak: {
            currentStreakDays: streak,
        },
        badges,
    };
};

const exportAllLocalData = async () => {
    await ensureInitialized();

    const profiles = await readJson(KEYS.PROFILES, DEFAULT_PROFILES);
    const currentProfileId = await AsyncStorage.getItem(KEYS.CURRENT_PROFILE_ID);
    const entries = await readJson(KEYS.ENTRIES, []);

    const payload = {
        exportedAt: nowIso(),
        app: {
            name: "bradbury-2026",
            schemaVersion: 1,
        },
        profiles,
        currentProfileId,
        entries,
    };

    return payload;
};

const resetAllLocalData = async () => {
    await AsyncStorage.removeItem(KEYS.ENTRIES);
    await AsyncStorage.removeItem(KEYS.CURRENT_PROFILE_ID);
    await AsyncStorage.removeItem(KEYS.PROFILES);
    await ensureInitialized();
};

export {
    getTodayDayKeyNY,
    getProfiles,
    getCurrentProfile,
    getCurrentProfileId,
    setCurrentProfileId,
    listEntries,
    upsertEntryForDayCategory,
    deleteEntryById,
    deleteEntryForDayCategory,
    getStatsSummary,
    exportAllLocalData,
    resetAllLocalData,
};
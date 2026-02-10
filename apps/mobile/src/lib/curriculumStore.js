/**
 * curriculumStore.js
 *
 * Local curriculum store (AsyncStorage).
 * Hydrate from server w/ replaceCurriculum to update local data.
 *
 * Terminology:
 * - TopicItem.category = "essay" | "story" | "poem"
 *
 * Backward compatibility:
 * - Older local data stored TopicItem.type instead of TopicItem.category.
 * - This store will read both, but will write only "category" going forward.
 *
 * Phase 3A:
 * - Add mergeCurriculumFromServer({ topics }) to support pull-latest merge.
 *
 * Merge rule:
 * - Topic identity: topic.id (clientId)
 * - TopicItem identity: item.id (clientId)
 * - For collisions: latest updatedAt wins when available, otherwise createdAt.
 * - If server item/topic lacks updatedAt, we treat it as createdAt.
 * - Does NOT delete local topics/items that do not exist on server.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bradbury_curriculum_v1";

const safeParse = (raw, fallback) => {
    try {
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const nowId = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizeCategory = (value) => {
    const s = String(value || "").trim().toLowerCase();
    if (s === "essay" || s === "story" || s === "poem") return s;
    return "";
};

const toMillis = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const normalizeTopicItem = (raw) => {
    const category = normalizeCategory(raw?.category || raw?.type);

    return {
        id: String(raw?.id || "").trim(),
        title: String(raw?.title || "").trim(),
        url: String(raw?.url || "").trim(),
        category,
        finished: Boolean(raw?.finished),
        createdAt: Number.isFinite(raw?.createdAt) ? raw.createdAt : Date.now(),
        updatedAt: Number.isFinite(raw?.updatedAt) ? raw.updatedAt : undefined,
    };
};

const normalizeTopic = (raw) => {
    const itemsRaw = Array.isArray(raw?.items) ? raw.items : [];
    const items = itemsRaw.map(normalizeTopicItem).filter((it) => it.id && it.title && it.category);

    return {
        id: String(raw?.id || "").trim(),
        name: String(raw?.name || "").trim(),
        createdAt: Number.isFinite(raw?.createdAt) ? raw.createdAt : Date.now(),
        updatedAt: Number.isFinite(raw?.updatedAt) ? raw.updatedAt : undefined,
        items,
    };
};

const loadCurriculum = async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const data = safeParse(raw, { topics: [] });

    if (!data || !Array.isArray(data.topics)) {
        return { topics: [] };
    }

    const topics = data.topics.map(normalizeTopic).filter((t) => t.id && t.name);
    return { topics };
};

const saveCurriculum = async (data) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
};

const replaceCurriculum = async (data) => {
    const safeTopicsRaw = Array.isArray(data?.topics) ? data.topics : [];
    const safeTopics = safeTopicsRaw.map(normalizeTopic).filter((t) => t.id && t.name);

    await saveCurriculum({ topics: safeTopics });
    return { ok: true, topics: safeTopics.length };
};

const listTopics = async () => {
    const data = await loadCurriculum();
    const topics = Array.isArray(data.topics) ? data.topics : [];
    return [...topics].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

const addTopic = async (name) => {
    const safeName = String(name || "").trim();
    if (!safeName) {
        return { ok: false, error: "name_required" };
    }

    const data = await loadCurriculum();

    const topic = {
        id: nowId("t"),
        name: safeName,
        createdAt: Date.now(),
        items: [],
    };

    data.topics = [topic, ...(data.topics || [])];

    await saveCurriculum(data);
    return { ok: true, topic };
};

const deleteTopic = async (topicId) => {
    const data = await loadCurriculum();
    data.topics = (data.topics || []).filter((t) => t.id !== topicId);
    await saveCurriculum(data);
    return { ok: true };
};

const getTopicById = async (topicId) => {
    const data = await loadCurriculum();
    const found = (data.topics || []).find((t) => t.id === topicId);
    return found || null;
};

const addTopicItem = async ({ topicId, title, url, category, type }) => {
    const safeTitle = String(title || "").trim();
    const safeUrl = String(url || "").trim();

    const safeCategory = normalizeCategory(category || type);

    if (!safeTitle) return { ok: false, error: "title_required" };
    if (!safeCategory) return { ok: false, error: "invalid_category" };

    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    const item = {
        id: nowId("i"),
        title: safeTitle,
        url: safeUrl || "",
        category: safeCategory,
        finished: false,
        createdAt: Date.now(),
    };

    topic.items = [item, ...(topic.items || [])];

    await saveCurriculum(data);
    return { ok: true, item };
};

const toggleTopicItemFinished = async ({ topicId, itemId }) => {
    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    const item = (topic.items || []).find((i) => i.id === itemId);
    if (!item) return { ok: false, error: "item_not_found" };

    item.finished = !item.finished;
    item.updatedAt = Date.now();

    await saveCurriculum(data);
    return { ok: true, item };
};

const deleteTopicItem = async ({ topicId, itemId }) => {
    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    topic.items = (topic.items || []).filter((i) => i.id !== itemId);

    await saveCurriculum(data);
    return { ok: true };
};

const pickNewer = (a, b) => {
    const aUpdated = toMillis(a?.updatedAt);
    const bUpdated = toMillis(b?.updatedAt);

    if (aUpdated || bUpdated) {
        return bUpdated >= aUpdated ? b : a;
    }

    const aCreated = toMillis(a?.createdAt);
    const bCreated = toMillis(b?.createdAt);
    return bCreated >= aCreated ? b : a;
};

/**
 * mergeCurriculumFromServer
 *
 * - Merge server topics/items into local.
 * - Does not delete local-only topics/items.
 * - Uses latest updatedAt (or createdAt) to decide winner for collisions.
 *
 * Returns counts for UI.
 */
const mergeCurriculumFromServer = async ({ topics } = {}) => {
    const serverTopicsRaw = Array.isArray(topics) ? topics : [];
    const serverTopics = serverTopicsRaw.map(normalizeTopic).filter((t) => t.id && t.name);

    const localData = await loadCurriculum();
    const localTopics = Array.isArray(localData?.topics) ? localData.topics : [];

    const topicMap = new Map();
    for (const lt of localTopics) {
        topicMap.set(String(lt.id), lt);
    }

    let topicsAdded = 0;
    let topicsUpdated = 0;
    let itemsAdded = 0;
    let itemsUpdated = 0;

    for (const st of serverTopics) {
        const id = String(st.id);
        const existingTopic = topicMap.get(id);

        if (!existingTopic) {
            topicMap.set(id, st);
            topicsAdded += 1;
            itemsAdded += (st.items || []).length;
            continue;
        }

        // Merge topic core fields
        const mergedTopicCore = pickNewer(existingTopic, st);

        // Merge items by id
        const itemMap = new Map();
        for (const li of existingTopic.items || []) {
            itemMap.set(String(li.id), li);
        }

        for (const si of st.items || []) {
            const itemId = String(si.id);
            const existingItem = itemMap.get(itemId);

            if (!existingItem) {
                itemMap.set(itemId, si);
                itemsAdded += 1;
                continue;
            }

            const mergedItem = pickNewer(existingItem, si);
            itemMap.set(itemId, mergedItem);

            const prevUpdated = toMillis(existingItem?.updatedAt) || toMillis(existingItem?.createdAt);
            const nextUpdated = toMillis(mergedItem?.updatedAt) || toMillis(mergedItem?.createdAt);
            if (nextUpdated !== prevUpdated) {
                itemsUpdated += 1;
            }
        }

        const mergedTopic = {
            ...mergedTopicCore,
            items: Array.from(itemMap.values()),
        };

        topicMap.set(id, mergedTopic);

        const prevTopicUpdated = toMillis(existingTopic?.updatedAt) || toMillis(existingTopic?.createdAt);
        const nextTopicUpdated = toMillis(mergedTopic?.updatedAt) || toMillis(mergedTopic?.createdAt);
        if (nextTopicUpdated !== prevTopicUpdated || String(mergedTopic?.name || "") !== String(existingTopic?.name || "")) {
            topicsUpdated += 1;
        }
    }

    const mergedTopics = Array.from(topicMap.values());
    await saveCurriculum({ topics: mergedTopics });

    return {
        ok: true,
        topicsAdded,
        topicsUpdated,
        itemsAdded,
        itemsUpdated,
        totalTopics: mergedTopics.length,
    };
};

export {
    KEY,
    loadCurriculum,
    saveCurriculum,
    replaceCurriculum,
    mergeCurriculumFromServer,
    listTopics,
    addTopic,
    deleteTopic,
    getTopicById,
    addTopicItem,
    toggleTopicItemFinished,
    deleteTopicItem,
};
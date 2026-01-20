import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bradbury_curriculum_v1";

// {
//   topics: [
//     {
//       id: "t_...",
//       name: "Engineering",
//       createdAt: 123456,
//       items: [
//         {
//           id: "i_...",
//           title: "The Design of Everyday Things",
//           url: "https://...",
//           type: "essay" | "story" | "poem",
//           finished: false,
//           createdAt: 123456
//         }
//       ]
//     }
//   ]
// }

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

export const loadCurriculum = async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const data = safeParse(raw, { topics: [] });

    if (!data || !Array.isArray(data.topics)) {
        return { topics: [] };
    }

    return data;
};

export const saveCurriculum = async (data) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
};

export const listTopics = async () => {
    const data = await loadCurriculum();
    const topics = Array.isArray(data.topics) ? data.topics : [];
    return [...topics].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const addTopic = async (name) => {
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

export const deleteTopic = async (topicId) => {
    const data = await loadCurriculum();
    data.topics = (data.topics || []).filter((t) => t.id !== topicId);
    await saveCurriculum(data);
    return { ok: true };
};

export const getTopicById = async (topicId) => {
    const data = await loadCurriculum();
    const found = (data.topics || []).find((t) => t.id === topicId);
    return found || null;
};

export const addTopicItem = async ({ topicId, title, url, type }) => {
    const safeTitle = String(title || "").trim();
    const safeUrl = String(url || "").trim();
    const safeType = String(type || "").trim();

    if (!safeTitle) return { ok: false, error: "title_required" };

    const allowed = ["essay", "story", "poem"];
    if (!allowed.includes(safeType)) return { ok: false, error: "invalid_type" };

    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    const item = {
        id: nowId("i"),
        title: safeTitle,
        url: safeUrl || "",
        type: safeType,
        finished: false,
        createdAt: Date.now(),
    };

    topic.items = [item, ...(topic.items || [])];

    await saveCurriculum(data);
    return { ok: true, item };
};

export const toggleTopicItemFinished = async ({ topicId, itemId }) => {
    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    const item = (topic.items || []).find((i) => i.id === itemId);
    if (!item) return { ok: false, error: "item_not_found" };

    item.finished = !item.finished;

    await saveCurriculum(data);
    return { ok: true, item };
};

export const deleteTopicItem = async ({ topicId, itemId }) => {
    const data = await loadCurriculum();
    const topic = (data.topics || []).find((t) => t.id === topicId);
    if (!topic) return { ok: false, error: "topic_not_found" };

    topic.items = (topic.items || []).filter((i) => i.id !== itemId);

    await saveCurriculum(data);
    return { ok: true };
};
/**
 * serverHydrate.js
 *
 * Phase 1: Replace-local hydration from server.
 *
 * IMPORTANT (Path A):
 * - Local curriculum IDs MUST come from server clientId fields, not server DB ids.
 * - This keeps identity stable across devices and sync runs.
 */

import { listEntries as apiListEntries, listTopics as apiListTopics } from "./serverApi";

import { replaceAllEntries } from "./store";
import { replaceCurriculum } from "./curriculumStore";

const normalizeEntry = (e) => {
    return {
        // Optional: if server sends clientId later, we can store it, but store.js doesn't use it yet.
        clientId: e?.clientId ? String(e.clientId).trim() : undefined,

        dayKey: String(e?.dayKey || "").trim(),
        category: String(e?.category || "").trim(),
        title: String(e?.title || "").trim(),
        author: String(e?.author || "").trim(),
        url: String(e?.url || "").trim(),
        notes: String(e?.notes || "").trim(),
        tags: Array.isArray(e?.tags) ? e.tags.map((t) => String(t)) : [],
        rating: Number.isFinite(e?.rating) ? e.rating : 5,
        wordCount: e?.wordCount == null ? null : Number(e.wordCount),
        createdAt: e?.createdAt ? new Date(e.createdAt).getTime() : Date.now(),
        updatedAt: e?.updatedAt ? new Date(e.updatedAt).getTime() : Date.now(),
    };
};

const normalizeTopic = (t) => {
    const itemsRaw = Array.isArray(t?.items) ? t.items : [];

    // Use clientId for local id
    const topicClientId = String(t?.clientId || "").trim();

    return {
        id: topicClientId,
        name: String(t?.name || "").trim(),
        createdAt: t?.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
        items: itemsRaw.map((it) => {
            const itemClientId = String(it?.clientId || "").trim();

            return {
                id: itemClientId,
                title: String(it?.title || "").trim(),
                url: String(it?.url || "").trim(),
                category: String(it?.category || "").trim(),
                finished: Boolean(it?.finished),
                createdAt: it?.createdAt ? new Date(it.createdAt).getTime() : Date.now(),
            };
        }),
    };
};

/**
 * hydrateFromServer
 *
 * mode:
 * - "replace": overwrite local entries + curriculum completely
 */
const hydrateFromServer = async ({ mode = "replace" } = {}) => {
    if (mode !== "replace") {
        throw new Error("unsupported_hydrate_mode");
    }

    // 1) Fetch from server
    const serverEntriesPayload = await apiListEntries({});
    const serverEntries = Array.isArray(serverEntriesPayload?.entries)
        ? serverEntriesPayload.entries
        : Array.isArray(serverEntriesPayload)
            ? serverEntriesPayload
            : [];

    const serverTopicsPayload = await apiListTopics();
    const serverTopics = Array.isArray(serverTopicsPayload?.topics)
        ? serverTopicsPayload.topics
        : Array.isArray(serverTopicsPayload)
            ? serverTopicsPayload
            : [];

    // 2) Normalize
    const normalizedEntries = serverEntries
        .map(normalizeEntry)
        .filter((e) => e.dayKey && e.category && e.title);

    const normalizedTopics = serverTopics
        .map(normalizeTopic)
        .filter((t) => t.id && t.name);

    // Filter items missing stable client IDs
    for (const t of normalizedTopics) {
        t.items = (t.items || []).filter((it) => it.id && it.title && it.category);
    }

    // 3) Write into existing local storage keys
    await replaceAllEntries(normalizedEntries);
    await replaceCurriculum({ topics: normalizedTopics });

    return {
        ok: true,
        entriesCount: normalizedEntries.length,
        topicsCount: normalizedTopics.length,
    };
};

export {
    hydrateFromServer,
};
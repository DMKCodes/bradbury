/**
 * serverHydrate.js
 *
 * Early testing flow:
 * - Pull entries & topics from server
 * - Normalize into shapes mobile local stores expect
 * - Replace local stores (user action only)
 */

import { listEntries as apiListEntries, listTopics as apiListTopics } from "./serverApi";

import { replaceAllEntries } from "./store";
import { replaceCurriculum } from "./curriculumStore";

const normalizeEntry = (e) => {
    const ratingNum = Number(e?.rating);
    const wordCountNum = e?.wordCount == null ? null : Number(e.wordCount);

    return {
        dayKey: String(e?.dayKey || "").trim(),
        category: String(e?.category || "").trim(),
        title: String(e?.title || "").trim(),
        author: String(e?.author || "").trim(),
        url: String(e?.url || "").trim(),
        notes: String(e?.notes || "").trim(),
        tags: Array.isArray(e?.tags) ? e.tags.map((t) => String(t)) : [],
        rating: Number.isFinite(ratingNum) ? ratingNum : 5,
        wordCount: Number.isFinite(wordCountNum) ? wordCountNum : null,
        createdAt: e?.createdAt ? new Date(e.createdAt).getTime() : Date.now(),
        updatedAt: e?.updatedAt ? new Date(e.updatedAt).getTime() : Date.now(),
    };
};

const normalizeTopic = (t) => {
    const itemsRaw = Array.isArray(t?.items) ? t.items : [];

    return {
        id: String(t?.id || "").trim(),
        name: String(t?.name || "").trim(),
        createdAt: t?.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
        items: itemsRaw.map((it) => ({
            id: String(it?.id || "").trim(),
            title: String(it?.title || "").trim(),
            url: String(it?.url || "").trim(),
            type: String(it?.category || it?.type || "").trim(),
            finished: Boolean(it?.finished),
            createdAt: it?.createdAt ? new Date(it.createdAt).getTime() : Date.now(),
        })),
    };
};

/**
 * hydrateFromServer
 *
 * mode:
 * - "replace": overwrite local entries & curriculum completely
 *
 * Returns:
 * - { ok:true, entriesCount, topicsCount }
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
/**
 * serverPull.js
 *
 * Phase 3A: Pull latest (merge) from server into local stores.
 *
 * Behavior:
 * - Fetch server entries + topics
 * - Normalize lightly (serverHydrate already does heavy normalization)
 * - Merge into local using:
 *   - mergeEntriesFromServer(entries)
 *   - mergeCurriculumFromServer({ topics })
 *
 * Conflict rule:
 * - latest updatedAt wins (server vs local), per store merge functions.
 */

import { listEntries as apiListEntries, listTopics as apiListTopics } from "./serverApi";
import { mergeEntriesFromServer } from "./store";
import { mergeCurriculumFromServer } from "./curriculumStore";

const pullLatestMerge = async () => {
    // Entries
    const serverEntriesPayload = await apiListEntries({});
    const serverEntries = Array.isArray(serverEntriesPayload?.entries)
        ? serverEntriesPayload.entries
        : Array.isArray(serverEntriesPayload)
            ? serverEntriesPayload
            : [];

    // Topics
    const serverTopicsPayload = await apiListTopics();
    const serverTopics = Array.isArray(serverTopicsPayload?.topics)
        ? serverTopicsPayload.topics
        : Array.isArray(serverTopicsPayload)
            ? serverTopicsPayload
            : [];

    const entriesRes = await mergeEntriesFromServer(serverEntries);
    const curriculumRes = await mergeCurriculumFromServer({ topics: serverTopics });

    return {
        ok: true,
        entries: entriesRes,
        curriculum: curriculumRes,
    };
};

export {
    pullLatestMerge,
};
/**
 * serverSyncCurriculum.js
 *
 * Phase 2B (manual sync):
 * - Upload local Curriculum -> server, using stable clientIds.
 *
 * Rules (idempotent):
 * - Topics upsert by (userId, clientId) via POST /topics with clientId
 * - Topic items upsert by (topicId, clientId) via POST /topics/:topicId/items with clientId
 *
 */

import { listTopics as listLocalTopics } from "./curriculumStore";
import { createTopic, addTopicItem } from "./serverApi";

const normalizeType = (t) => {
    const s = String(t || "").trim().toLowerCase();
    if (s === "essay" || s === "story" || s === "poem") return s;
    return null;
};

const normalizeText = (v) => {
    return String(v || "").trim();
};

const normalizeUrl = (v) => {
    return String(v || "").trim();
};

const normalizeBool = (v) => {
    return Boolean(v);
};

/**
 * uploadLocalCurriculumToServer
 *
 * Options:
 * - limitTopics: number (optional) - for testing
 * - onProgress: function({ topicsUpserted, itemsUpserted, skipped, failed, totalTopics }) (optional)
 *
 * Returns:
 * - {
 *     ok: true,
 *     totalTopics,
 *     topicsUpserted,
 *     itemsUpserted,
 *     skipped,
 *     failed,
 *     firstError
 *   }
 */
const uploadLocalCurriculumToServer = async ({ limitTopics, onProgress } = {}) => {
    const allTopics = await listLocalTopics();
    const totalTopics = Number.isFinite(Number(limitTopics))
        ? Math.min(allTopics.length, Number(limitTopics))
        : allTopics.length;

    let topicsUpserted = 0;
    let itemsUpserted = 0;
    let skipped = 0;
    let failed = 0;
    let firstError = null;

    const report = () => {
        if (typeof onProgress === "function") {
            onProgress({ topicsUpserted, itemsUpserted, skipped, failed, totalTopics });
        }
    };

    for (let ti = 0; ti < totalTopics; ti += 1) {
        const t = allTopics[ti];

        const topicClientId = normalizeText(t?.id);
        const topicName = normalizeText(t?.name);

        if (!topicClientId || !topicName) {
            skipped += 1;
            report();
            continue;
        }

        try {
            // Upsert topic by clientId
            const created = await createTopic({ name: topicName, clientId: topicClientId });
            const serverTopicId = created?.topic?.id;

            if (!serverTopicId) {
                throw new Error("topic_upsert_missing_id");
            }

            topicsUpserted += 1;
            report();

            const localItems = Array.isArray(t?.items) ? t.items : [];

            for (const it of localItems) {
                const itemClientId = normalizeText(it?.id);
                const title = normalizeText(it?.title);
                const url = normalizeUrl(it?.url);
                const category = normalizeType(it?.category || it?.type);
                const finished = normalizeBool(it?.finished);

                if (!itemClientId || !title || !category) {
                    skipped += 1;
                    report();
                    continue;
                }

                try {
                    await addTopicItem(serverTopicId, {
                        clientId: itemClientId,
                        title,
                        url,
                        category,
                        finished,
                    });

                    itemsUpserted += 1;
                } catch (err) {
                    failed += 1;
                    if (!firstError) firstError = String(err?.message || err);
                    console.error("[uploadLocalCurriculumToServer] item failed:", { topicClientId, itemClientId, title }, err);
                }

                report();
            }
        } catch (err) {
            failed += 1;
            if (!firstError) firstError = String(err?.message || err);
            console.error("[uploadLocalCurriculumToServer] topic failed:", { topicClientId, topicName }, err);
            report();
        }
    }

    return {
        ok: true,
        totalTopics,
        topicsUpserted,
        itemsUpserted,
        skipped,
        failed,
        firstError,
    };
};

export {
    uploadLocalCurriculumToServer,
};
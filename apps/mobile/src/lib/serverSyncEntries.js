/**
 * serverSyncEntries.js
 *
 * - Upload local entries -> server, via /entries/upsert.
 *
 * Design goals:
 * - Explicit and safe
 * - Offline-first
 * - Conservative validation (skip entries, no fail)
 * 
 */

import { listEntries as listLocalEntries } from "./store";
import { upsertEntry as apiUpsertEntry } from "./serverApi";

const normalizeCategory = (c) => {
    const s = String(c || "").trim().toLowerCase();
    if (s === "essay" || s === "story" || s === "poem") return s;
    return null;
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags
        .map((t) => String(t || "").trim())
        .filter(Boolean);
};

const normalizeRating = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 5;
    if (n < 1) return 1;
    if (n > 5) return 5;
    return n;
};

const normalizeWordCount = (v) => {
    if (v === "" || v == null) return null;
    const n = Number.parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
};

/**
 * uploadLocalEntriesToServer
 *
 * Options:
 * - limit: number (optional) - for test runs (e.g. upload first 5 only)
 * - onProgress: function({ uploaded, skipped, failed, total }) (optional)
 *
 * Returns:
 * - {
 *     ok: true,
 *     total,
 *     uploaded,
 *     skipped,
 *     failed,
 *     firstError: string | null
 *   }
 */
const uploadLocalEntriesToServer = async ({ limit, onProgress } = {}) => {
    const all = await listLocalEntries();
    const total = Number.isFinite(Number(limit)) ? Math.min(all.length, Number(limit)) : all.length;

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;
    let firstError = null;

    const report = () => {
        if (typeof onProgress === "function") {
            onProgress({ uploaded, skipped, failed, total });
        }
    };

    for (let i = 0; i < total; i += 1) {
        const e = all[i];

        const dayKey = String(e?.dayKey || "").trim();
        const category = normalizeCategory(e?.category);
        const title = String(e?.title || "").trim();

        if (!dayKey || !category || !title) {
            skipped += 1;
            report();
            continue;
        }

        const payload = {
            dayKey,
            category,
            title,
            author: String(e?.author || "").trim(),
            url: String(e?.url || "").trim(),
            notes: String(e?.notes || "").trim(),
            tags: normalizeTags(e?.tags),
            rating: normalizeRating(e?.rating),
            wordCount: normalizeWordCount(e?.wordCount),
        };

        try {
            await apiUpsertEntry(payload);
            uploaded += 1;
        } catch (err) {
            failed += 1;
            if (!firstError) {
                firstError = String(err?.message || err);
            }

            // Continue, not abort. Intentional for alpha testing.
            console.error("[uploadLocalEntriesToServer] failed entry:", payload, err);
        }

        report();
    }

    return {
        ok: true,
        total,
        uploaded,
        skipped,
        failed,
        firstError,
    };
};

export {
    uploadLocalEntriesToServer,
};
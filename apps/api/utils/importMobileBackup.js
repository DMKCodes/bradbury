/**
 * apps/api/utils/importMobileBackup.js
 *
 * Import a Bradbury Daily mobile clipboard backup into the API database.
 *
 * Usage (run from apps/api):
 *   node ./utils/importMobileBackup.js --email you@example.com --file ./utils/bradbury_data.txt --dry-run
 *   node ./utils/importMobileBackup.js --email you@example.com --file ./utils/bradbury_data.txt
 *
 * Optional:
 *   --purge      Deletes existing Entries + Topics/Items for the user before importing (DANGEROUS).
 *
 * Notes:
 * - Mobile backup format is:
 *   {
 *     exportedAt,
 *     prefix,
 *     keys: [...],
 *     data: {
 *       bradbury_entries_v1: "{...stringified json...}",
 *       bradbury_curriculum_v1: "{...stringified json...}"
 *     }
 *   }
 *
 * - This script imports:
 *   - Entries -> Entry
 *   - Topics + items -> Topic + TopicItem
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import process from "process";

// IMPORTANT: use the same Prisma instance as the API server.
// In Batch B, server.js imports prisma from "./lib/prisma.js". :contentReference[oaicite:2]{index=2}
import prisma from "../src/lib/prisma.js";

const parseArgs = (argv) => {
    const out = {};
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (!a.startsWith("--")) continue;

        const key = a.slice(2).trim();
        const next = argv[i + 1];

        // flags
        if (key === "dry-run" || key === "dryRun") {
            out.dryRun = true;
            continue;
        }
        if (key === "purge") {
            out.purge = true;
            continue;
        }

        // key/value
        if (next && !next.startsWith("--")) {
            out[key] = next;
            i += 1;
        } else {
            out[key] = true;
        }
    }
    return out;
};

const safeJsonParse = (label, raw) => {
    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (err) {
        return { ok: false, error: `${label}: invalid JSON (${err?.message || String(err)})` };
    }
};

const isValidCategory = (v) => {
    const s = String(v || "").trim();
    return s === "essay" || s === "story" || s === "poem";
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags
        .map((t) => String(t || "").trim())
        .filter(Boolean);
};

const toDateOrNull = (ms) => {
    if (ms === null || ms === undefined) return null;
    const n = Number(ms);
    if (!Number.isFinite(n)) return null;
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return null;
    return d;
};

const main = async () => {
    const args = parseArgs(process.argv.slice(2));

    const email = String(args.email || "").trim();
    const fileArg = String(args.file || "").trim();
    const dryRun = Boolean(args.dryRun);
    const purge = Boolean(args.purge);

    if (!email) {
        console.error("Missing --email");
        process.exitCode = 1;
        return;
    }
    if (!fileArg) {
        console.error("Missing --file");
        process.exitCode = 1;
        return;
    }

    const absPath = path.isAbsolute(fileArg)
        ? fileArg
        : path.join(process.cwd(), fileArg);

    if (!fs.existsSync(absPath)) {
        console.error(`File not found: ${absPath}`);
        process.exitCode = 1;
        return;
    }

    const raw = fs.readFileSync(absPath, "utf-8");
    const outerParsed = safeJsonParse("outer backup", raw);
    if (!outerParsed.ok) {
        console.error(outerParsed.error);
        process.exitCode = 1;
        return;
    }

    const backup = outerParsed.value || {};
    const dataMap = backup.data || {};

    // These are stringified JSON in the mobile export (see your file). :contentReference[oaicite:3]{index=3}
    const curriculumRaw = dataMap.bradbury_curriculum_v1 || "";
    const entriesRaw = dataMap.bradbury_entries_v1 || "";

    const curriculumParsed = curriculumRaw
        ? safeJsonParse("bradbury_curriculum_v1", curriculumRaw)
        : { ok: true, value: null };

    const entriesParsed = entriesRaw
        ? safeJsonParse("bradbury_entries_v1", entriesRaw)
        : { ok: true, value: null };

    if (!curriculumParsed.ok) {
        console.error(curriculumParsed.error);
        process.exitCode = 1;
        return;
    }
    if (!entriesParsed.ok) {
        console.error(entriesParsed.error);
        process.exitCode = 1;
        return;
    }

    const curriculum = curriculumParsed.value;
    const entriesBlob = entriesParsed.value;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
    });

    if (!user) {
        console.error(`No user found for email: ${email}`);
        console.error("Create the user first via POST /api/v1/auth/register, then re-run this script.");
        process.exitCode = 1;
        return;
    }

    const userId = user.id;

    const entries = Array.isArray(entriesBlob?.entries) ? entriesBlob.entries : [];
    const topics = Array.isArray(curriculum?.topics) ? curriculum.topics : [];

    // --- Build normalized import payloads ---

    const entryRows = [];
    for (const e of entries) {
        const dayKey = String(e?.dayKey || "").trim();
        const category = String(e?.category || "").trim();
        if (!dayKey || !isValidCategory(category)) continue;

        entryRows.push({
            userId,
            dayKey,
            category,
            title: String(e?.title || "").trim() || "(untitled)",
            author: String(e?.author || "").trim(),
            url: String(e?.url || "").trim(), // mobile export may not have it; defaults to ""
            notes: String(e?.notes || "").trim(),
            rating: Number.isFinite(Number(e?.rating)) ? Number(e.rating) : 5,
            wordCount: e?.wordCount === null || e?.wordCount === undefined ? null : Number(e.wordCount),
            tags: normalizeTags(e?.tags),
            createdAt: toDateOrNull(e?.createdAt),
            updatedAt: toDateOrNull(e?.updatedAt),
        });
    }

    const topicRows = [];
    for (const t of topics) {
        const name = String(t?.name || "").trim();
        if (!name) continue;

        const items = Array.isArray(t?.items) ? t.items : [];
        topicRows.push({
            userId,
            name,
            items: items
                .map((it) => {
                    const category = String(it?.type || it?.category || "").trim();
                    if (!isValidCategory(category)) return null;

                    return {
                        title: String(it?.title || "").trim() || "(untitled)",
                        url: String(it?.url || "").trim(),
                        category,
                        author: String(it?.author || "").trim(),
                        wordCount: it?.wordCount === null || it?.wordCount === undefined ? null : Number(it.wordCount),
                        notes: String(it?.notes || "").trim(),
                        tags: normalizeTags(it?.tags),
                        finished: Boolean(it?.finished),
                        finishedAt: it?.finished ? (toDateOrNull(it?.finishedAt) || new Date()) : null,
                        createdAt: toDateOrNull(it?.createdAt),
                    };
                })
                .filter(Boolean),
        });
    }

    // --- Preview ---
    console.log("=== Import Preview ===");
    console.log(`User: ${user.email} (${userId})`);
    console.log(`Entries found: ${entryRows.length}`);
    console.log(`Topics found: ${topicRows.length}`);
    console.log(`Dry run: ${dryRun ? "YES" : "NO"}`);
    console.log(`Purge first: ${purge ? "YES" : "NO"}`);
    console.log("======================");

    if (dryRun) {
        return;
    }

    // --- Execute import ---
    await prisma.$transaction(async (tx) => {
        if (purge) {
            // Delete in dependency order (TopicItem -> Topic, Entry).
            // TopicItem cascades on Topic delete, but explicit order is safer.
            await tx.entry.deleteMany({ where: { userId } });
            await tx.topic.deleteMany({ where: { userId } });
        }

        // Upsert Entries by @@unique([userId, dayKey, category]) :contentReference[oaicite:4]{index=4}
        for (const row of entryRows) {
            const { createdAt, updatedAt, ...data } = row;

            await tx.entry.upsert({
                where: {
                    userId_dayKey_category: {
                        userId: data.userId,
                        dayKey: data.dayKey,
                        category: data.category,
                    },
                },
                create: {
                    ...data,
                    ...(createdAt ? { createdAt } : null),
                    ...(updatedAt ? { updatedAt } : null),
                },
                update: {
                    ...data,
                    // On update, Prisma may override updatedAt due to @updatedAt in schema.
                    // That’s OK for now; conflict resolution later can rely on server updatedAt.
                },
            });
        }

        // Create Topics and TopicItems.
        // NOTE: Topic has no unique constraint on (userId, name) in schema, so we avoid upsert.
        // If you want idempotent imports later, we can add @@unique([userId, name]) and then upsert.
        for (const t of topicRows) {
            const created = await tx.topic.create({
                data: {
                    userId: t.userId,
                    name: t.name,
                },
                select: { id: true },
            });

            for (const it of t.items) {
                const createdAt = it.createdAt;
                const { createdAt: _omit, ...itemData } = it;

                await tx.topicItem.create({
                    data: {
                        topicId: created.id,
                        ...itemData,
                        ...(createdAt ? { createdAt } : null),
                    },
                });
            }
        }
    });

    console.log("Import complete.");
};

main()
    .catch((err) => {
        console.error("Import failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await prisma.$disconnect();
        } catch (_err) {
            // ignore
        }
    });
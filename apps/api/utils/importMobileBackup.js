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
import prisma from "../src/lib/prisma.js";

const parseArgs = (argv) => {
    const out = {};
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (!a.startsWith("--")) continue;

        const key = a.slice(2).trim();
        const next = argv[i + 1];

        if (key === "dry-run" || key === "dryRun") {
            out.dryRun = true;
            continue;
        }
        if (key === "purge") {
            out.purge = true;
            continue;
        }

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
    return tags.map((t) => String(t || "").trim()).filter(Boolean);
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

    // These are stringified JSON in the mobile export.
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

    // --- Normalize entries ---
    const entryRows = [];
    for (const e of entries) {
        const dayKey = String(e?.dayKey || "").trim();
        const category = String(e?.category || "").trim();
        if (!dayKey || !isValidCategory(category)) continue;

        const createdAt = toDateOrNull(e?.createdAt);
        const updatedAt = toDateOrNull(e?.updatedAt);

        entryRows.push({
            userId,
            dayKey,
            category,
            title: String(e?.title || "").trim() || "(untitled)",
            author: String(e?.author || "").trim(),
            url: String(e?.url || "").trim(),
            notes: String(e?.notes || "").trim(),
            rating: Number.isFinite(Number(e?.rating)) ? Number(e.rating) : 5,
            wordCount: e?.wordCount === null || e?.wordCount === undefined ? null : Number(e.wordCount),
            tags: normalizeTags(e?.tags),
            ...(createdAt ? { createdAt } : null),
            ...(updatedAt ? { updatedAt } : null),
        });
    }

    // --- Normalize topics + items ---
    const topicRows = [];
    for (const t of topics) {
        const name = String(t?.name || "").trim();
        if (!name) continue;

        const items = Array.isArray(t?.items) ? t.items : [];
        const normalizedItems = items
            .map((it) => {
                const category = String(it?.type || it?.category || "").trim();
                if (!isValidCategory(category)) return null;

                const createdAt = toDateOrNull(it?.createdAt);
                const finished = Boolean(it?.finished);
                const finishedAt = finished ? (toDateOrNull(it?.finishedAt) || new Date()) : null;

                return {
                    title: String(it?.title || "").trim() || "(untitled)",
                    url: String(it?.url || "").trim(),
                    category,
                    author: String(it?.author || "").trim(),
                    wordCount: it?.wordCount === null || it?.wordCount === undefined ? null : Number(it.wordCount),
                    notes: String(it?.notes || "").trim(),
                    tags: normalizeTags(it?.tags),
                    finished,
                    finishedAt,
                    ...(createdAt ? { createdAt } : null),
                };
            })
            .filter(Boolean);

        topicRows.push({
            userId,
            name,
            items: normalizedItems,
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

    // ============================================================
    // IMPORTANT CHANGE:
    // - No interactive transaction callback.
    // - Purge path uses createMany() for speed.
    // This avoids Prisma's default 5s interactive transaction timeout.
    // ============================================================

    if (purge) {
        console.log("[import] Purging existing user data...");

        // Delete in safe order: TopicItem -> Topic -> Entry
        const existingTopics = await prisma.topic.findMany({
            where: { userId },
            select: { id: true },
        });
        const topicIds = existingTopics.map((t) => t.id);

        if (topicIds.length > 0) {
            await prisma.topicItem.deleteMany({
                where: { topicId: { in: topicIds } },
            });
        }

        await prisma.topic.deleteMany({ where: { userId } });
        await prisma.entry.deleteMany({ where: { userId } });

        console.log("[import] Purge complete.");
        console.log("[import] Creating entries (createMany) ...");

        if (entryRows.length > 0) {
            // skipDuplicates is safe even if unique key exists;
            // when purging, duplicates shouldn't exist anyway.
            await prisma.entry.createMany({
                data: entryRows,
                skipDuplicates: true,
            });
        }

        console.log("[import] Entries created.");

        console.log("[import] Creating topics and items...");

        for (const t of topicRows) {
            const createdTopic = await prisma.topic.create({
                data: {
                    userId: t.userId,
                    name: t.name,
                },
                select: { id: true, name: true },
            });

            if (t.items.length > 0) {
                const itemData = t.items.map((it) => ({
                    topicId: createdTopic.id,
                    // Your TopicItem model has these fields; if some are not in schema, Prisma will error and we’ll adjust.
                    title: it.title,
                    url: it.url,
                    category: it.category,
                    finished: it.finished,
                    finishedAt: it.finishedAt,
                    author: it.author || "",
                    notes: it.notes || "",
                    wordCount: it.wordCount ?? null,
                    tags: it.tags || [],
                    ...(it.createdAt ? { createdAt: it.createdAt } : null),
                }));

                await prisma.topicItem.createMany({
                    data: itemData,
                    skipDuplicates: true,
                });
            }

            console.log(`[import] Topic created: ${createdTopic.name} (items: ${t.items.length})`);
        }

        console.log("[import] Import complete (purge mode).");
        return;
    }

    // Non-purge mode: keep upsert semantics (idempotent-ish).
    // Still avoid interactive transaction; do sequential upserts.
    console.log("[import] Importing (non-purge): upserting entries...");

    for (let i = 0; i < entryRows.length; i += 1) {
        const row = entryRows[i];

        await prisma.entry.upsert({
            where: {
                userId_dayKey_category: {
                    userId: row.userId,
                    dayKey: row.dayKey,
                    category: row.category,
                },
            },
            create: row,
            update: {
                title: row.title,
                author: row.author,
                url: row.url,
                notes: row.notes,
                rating: row.rating,
                wordCount: row.wordCount,
                tags: row.tags,
            },
        });

        if ((i + 1) % 25 === 0) {
            console.log(`[import] Upserted entries: ${i + 1}/${entryRows.length}`);
        }
    }

    console.log("[import] Entries upserted.");
    console.log("[import] Creating topics/items (non-purge): naive create (may duplicate if re-run).");

    for (const t of topicRows) {
        const createdTopic = await prisma.topic.create({
            data: {
                userId: t.userId,
                name: t.name,
            },
            select: { id: true, name: true },
        });

        if (t.items.length > 0) {
            const itemData = t.items.map((it) => ({
                topicId: createdTopic.id,
                title: it.title,
                url: it.url,
                category: it.category,
                finished: it.finished,
                finishedAt: it.finishedAt,
                author: it.author || "",
                notes: it.notes || "",
                wordCount: it.wordCount ?? null,
                tags: it.tags || [],
                ...(it.createdAt ? { createdAt: it.createdAt } : null),
            }));

            await prisma.topicItem.createMany({
                data: itemData,
                skipDuplicates: true,
            });
        }

        console.log(`[import] Topic created: ${createdTopic.name} (items: ${t.items.length})`);
    }

    console.log("[import] Import complete.");
};

main()
    .catch((err) => {
        console.error("Import failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await prisma.$disconnect();
        } catch {
            // ignore
        }
    });
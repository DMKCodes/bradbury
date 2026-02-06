import express from "express";
import { z } from "zod";
import { authRequired } from "../lib/auth.js";

const topicsRouter = express.Router();

topicsRouter.use(authRequired);

const ITEM_CATEGORY_VALUES = ["essay", "story", "poem"];

const createTopicSchema = z.object({
    name: z.string().min(1),
    // Stable ID generated client-side
    clientId: z.string().optional().nullable(),
});

const addItemBodySchema = z.object({
    title: z.string().min(1),
    url: z.string().optional().nullable(),
    category: z.enum(ITEM_CATEGORY_VALUES),
    author: z.string().optional().nullable(),
    wordCount: z.number().int().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),

    // Stable ID generated client-side
    clientId: z.string().optional().nullable(),

    // Mobile syncs finished state directly (no toggle drift)
    finished: z.boolean().optional().nullable(),
});

// ---------- Helpers ----------
const topicItemsOrderBy = [
    { finished: "asc" },
    { finishedAt: "desc" },
    { updatedAt: "desc" },
    { createdAt: "desc" },
];

const requireOwnedTopic = async (req, topicId) => {
    const found = await req.prisma.topic.findFirst({
        where: { id: topicId, userId: req.userId },
        select: { id: true },
    });
    return found;
};

// ---------- Topic routes ----------
topicsRouter.get("/", async (req, res, next) => {
    try {
        const rows = await req.prisma.topic.findMany({
            where: { userId: req.userId },
            orderBy: [{ updatedAt: "desc" }],
            include: { items: { orderBy: topicItemsOrderBy } },
        });

        return res.json({ ok: true, topics: rows });
    } catch (err) {
        return next(err);
    }
});

topicsRouter.post("/", async (req, res, next) => {
    try {
        const parsed = createTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const safeName = parsed.data.name.trim();
        const safeClientId = parsed.data.clientId ? String(parsed.data.clientId).trim() : "";

        // If clientId is provided, do idempotent upsert.
        if (safeClientId) {
            const topic = await req.prisma.topic.upsert({
                where: {
                    userId_clientId: {
                        userId: req.userId,
                        clientId: safeClientId,
                    },
                },
                create: {
                    userId: req.userId,
                    clientId: safeClientId,
                    name: safeName,
                },
                update: {
                    name: safeName,
                },
            });

            return res.json({ ok: true, topic });
        }

        // Else keep old behavior (web-friendly).
        const topic = await req.prisma.topic.create({
            data: {
                userId: req.userId,
                name: safeName,
            },
        });

        return res.json({ ok: true, topic });
    } catch (err) {
        return next(err);
    }
});

topicsRouter.get("/:topicId", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "").trim();
        if (!topicId) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const topic = await req.prisma.topic.findFirst({
            where: { id: topicId, userId: req.userId },
            include: { items: { orderBy: topicItemsOrderBy } },
        });

        if (!topic) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        return res.json({ ok: true, topic });
    } catch (err) {
        return next(err);
    }
});

topicsRouter.delete("/:topicId", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "").trim();
        if (!topicId) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const found = await requireOwnedTopic(req, topicId);
        if (!found) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        await req.prisma.topic.delete({ where: { id: topicId } });
        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
});

// ---------- RESTful TopicItem routes ----------

// POST /topics/:topicId/items
topicsRouter.post("/:topicId/items", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "").trim();
        if (!topicId) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const parsed = addItemBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const owned = await requireOwnedTopic(req, topicId);
        if (!owned) {
            return res.status(404).json({ ok: false, error: "topic_not_found" });
        }

        const {
            title,
            url,
            category,
            author,
            wordCount,
            notes,
            tags,
            clientId,
            finished,
        } = parsed.data;

        const safeClientId = clientId ? String(clientId).trim() : "";
        const nextFinished = finished == null ? false : Boolean(finished);
        const nextFinishedAt = nextFinished ? new Date() : null;

        // If clientId is provided, do idempotent upsert.
        if (safeClientId) {
            const item = await req.prisma.topicItem.upsert({
                where: {
                    topicId_clientId: {
                        topicId,
                        clientId: safeClientId,
                    },
                },
                create: {
                    topicId,
                    clientId: safeClientId,
                    title: title.trim(),
                    url: url ?? "",
                    category,
                    author: author ?? "",
                    wordCount: wordCount ?? null,
                    notes: notes ?? "",
                    tags: tags ?? [],
                    finished: nextFinished,
                    finishedAt: nextFinishedAt,
                },
                update: {
                    title: title.trim(),
                    url: url ?? "",
                    category,
                    author: author ?? "",
                    wordCount: wordCount ?? null,
                    notes: notes ?? "",
                    tags: tags ?? [],
                    finished: nextFinished,
                    finishedAt: nextFinishedAt,
                },
            });

            return res.json({ ok: true, item });
        }

        // Else keep old behavior (web-friendly).
        const item = await req.prisma.topicItem.create({
            data: {
                topicId,
                title: title.trim(),
                url: url ?? "",
                category,
                author: author ?? "",
                wordCount: wordCount ?? null,
                notes: notes ?? "",
                tags: tags ?? [],
                finished: false,
                finishedAt: null,
            },
        });

        return res.json({ ok: true, item });
    } catch (err) {
        return next(err);
    }
});

// POST /topics/:topicId/items/:itemId/toggle
topicsRouter.post("/:topicId/items/:itemId/toggle", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "").trim();
        const itemId = String(req.params.itemId || "").trim();
        if (!topicId || !itemId) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const owned = await requireOwnedTopic(req, topicId);
        if (!owned) {
            return res.status(404).json({ ok: false, error: "topic_not_found" });
        }

        const item = await req.prisma.topicItem.findFirst({
            where: { id: itemId, topicId },
        });

        if (!item) {
            return res.status(404).json({ ok: false, error: "item_not_found" });
        }

        const nextFinished = !item.finished;

        const updated = await req.prisma.topicItem.update({
            where: { id: itemId },
            data: {
                finished: nextFinished,
                finishedAt: nextFinished ? new Date() : null,
            },
        });

        return res.json({ ok: true, item: updated });
    } catch (err) {
        return next(err);
    }
});

// DELETE /topics/:topicId/items/:itemId
topicsRouter.delete("/:topicId/items/:itemId", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "").trim();
        const itemId = String(req.params.itemId || "").trim();
        if (!topicId || !itemId) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const owned = await requireOwnedTopic(req, topicId);
        if (!owned) {
            return res.status(404).json({ ok: false, error: "topic_not_found" });
        }

        const item = await req.prisma.topicItem.findFirst({
            where: { id: itemId, topicId },
            select: { id: true },
        });

        if (!item) {
            return res.status(404).json({ ok: false, error: "item_not_found" });
        }

        await req.prisma.topicItem.delete({ where: { id: itemId } });
        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
});

export { topicsRouter };
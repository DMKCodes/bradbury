import express from "express";
import { z } from "zod";
import { authRequired } from "../lib/auth.js";

const topicsRouter = express.Router();

topicsRouter.use(authRequired);

const ITEM_CATEGORY_VALUES = ["essay", "story", "poem"];

const createTopicSchema = z.object({
    name: z.string().min(1),
});

const addItemSchema = z.object({
    topicId: z.string().min(1),
    title: z.string().min(1),
    url: z.string().optional().nullable(),
    category: z.enum(ITEM_CATEGORY_VALUES),
    author: z.string().optional().nullable(),
    wordCount: z.number().int().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
});

topicsRouter.get("/", async (req, res, next) => {
    try {
        const rows = await req.prisma.topic.findMany({
            where: { userId: req.userId },
            orderBy: [{ updatedAt: "desc" }],
            include: {
                items: {
                    // Key requirement: unfinished first, finished last
                    orderBy: [
                        { finished: "asc" },
                        // for finished items, newest finished at top of finished section
                        { finishedAt: "desc" },
                        // stable tie-breakers
                        { updatedAt: "desc" },
                        { createdAt: "desc" },
                    ],
                },
            },
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

        const topic = await req.prisma.topic.create({
            data: {
                userId: req.userId,
                name: parsed.data.name.trim(),
            },
        });

        return res.json({ ok: true, topic });
    } catch (err) {
        return next(err);
    }
});

topicsRouter.delete("/:topicId", async (req, res, next) => {
    try {
        const topicId = String(req.params.topicId || "");

        const found = await req.prisma.topic.findFirst({
            where: { id: topicId, userId: req.userId },
            select: { id: true },
        });

        if (!found) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        await req.prisma.topic.delete({ where: { id: topicId } });
        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
});

// Add TopicItem
topicsRouter.post("/items", async (req, res, next) => {
    try {
        const parsed = addItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const { topicId, title, url, category, author, wordCount, notes, tags } = parsed.data;

        const topic = await req.prisma.topic.findFirst({
            where: { id: topicId, userId: req.userId },
            select: { id: true },
        });

        if (!topic) {
            return res.status(404).json({ ok: false, error: "topic_not_found" });
        }

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

// Toggle finished (and maintain finishedAt)
topicsRouter.post("/items/toggle", async (req, res, next) => {
    try {
        const parsed = z
            .object({
                topicId: z.string().min(1),
                itemId: z.string().min(1),
            })
            .safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const { topicId, itemId } = parsed.data;

        const topic = await req.prisma.topic.findFirst({
            where: { id: topicId, userId: req.userId },
            select: { id: true },
        });

        if (!topic) {
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

// Delete TopicItem (ownership enforced via topic.userId)
topicsRouter.delete("/items/:itemId", async (req, res, next) => {
    try {
        const itemId = String(req.params.itemId || "");

        const item = await req.prisma.topicItem.findFirst({
            where: { id: itemId },
            include: { topic: { select: { userId: true } } },
        });

        if (!item || item.topic.userId !== req.userId) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        await req.prisma.topicItem.delete({ where: { id: itemId } });
        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
});

export { topicsRouter };
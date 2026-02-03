import express from "express";
import { z } from "zod";
import { authRequired } from "../lib/auth.js";

const entriesRouter = express.Router();

const CATEGORY_VALUES = ["essay", "story", "poem"];

const upsertSchema = z.object({
    dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(CATEGORY_VALUES),
    title: z.string().min(1),
    author: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    rating: z.number().int().min(1).max(5).optional().default(5),
    wordCount: z.number().int().nonnegative().optional().nullable(),
});

entriesRouter.use(authRequired);

// List entries for current user (optionally filter by dayKey)
entriesRouter.get("/", async (req, res, next) => {
    try {
        const dayKey = req.query.dayKey ? String(req.query.dayKey) : null;

        const where = {
            userId: req.userId,
            ...(dayKey ? { dayKey } : {}),
        };

        const rows = await req.prisma.entry.findMany({
            where,
            orderBy: [{ dayKey: "desc" }, { updatedAt: "desc" }],
        });

        return res.json({ ok: true, entries: rows });
    } catch (err) {
        return next(err);
    }
});

// Upsert one entry per (user, dayKey, category)
entriesRouter.post("/upsert", async (req, res, next) => {
    try {
        const parsed = upsertSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const data = parsed.data;

        const entry = await req.prisma.entry.upsert({
            where: {
                userId_dayKey_category: {
                    userId: req.userId,
                    dayKey: data.dayKey,
                    category: data.category,
                },
            },
            create: {
                userId: req.userId,
                dayKey: data.dayKey,
                category: data.category,
                title: data.title,
                author: data.author ?? "",
                url: data.url ?? "",
                notes: data.notes ?? "",
                tags: data.tags ?? [],
                rating: data.rating ?? 5,
                wordCount: data.wordCount ?? null,
            },
            update: {
                title: data.title,
                author: data.author ?? "",
                url: data.url ?? "",
                notes: data.notes ?? "",
                tags: data.tags ?? [],
                rating: data.rating ?? 5,
                wordCount: data.wordCount ?? null,
            },
        });

        return res.json({ ok: true, entry });
    } catch (err) {
        return next(err);
    }
});

// Delete entry for (dayKey, category)
entriesRouter.delete("/", async (req, res, next) => {
    try {
        const parsed = z
            .object({
                dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                category: z.enum(CATEGORY_VALUES),
            })
            .safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        await req.prisma.entry.delete({
            where: {
                userId_dayKey_category: {
                    userId: req.userId,
                    dayKey: parsed.data.dayKey,
                    category: parsed.data.category,
                },
            },
        });

        return res.json({ ok: true });
    } catch (err) {
        if (err?.code === "P2025") {
            return res.json({ ok: true });
        }
        return next(err);
    }
});

export { entriesRouter };

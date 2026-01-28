import express from "express";
import { authRequired } from "../lib/auth.js";

/**
 * statsRouter
 *
 * Server-side stats computation.
 *
 * Endpoint:
 *   GET /api/v1/stats?year=All|YYYY
 *
 * Response:
 * {
 *   ok: true,
 *   selectedYear: "All" | "2026",
 *   availableYears: ["2026", "2025", ...],
 *   challengeStreakStats: { completeDayCount, currentStreak },
 *   countsByType: { essay, story, poem },
 *   totals: { totalWords, avgRating, ratingCount },
 *   perTypeAverages: {
 *     essay: { count, avgRating, avgWords, ratedCount, wordCount },
 *     story: { ... },
 *     poem: { ... }
 *   }
 * }
 */

const statsRouter = express.Router();

const TYPES = ["essay", "story", "poem"];
const isValidBradburyType = (t) => TYPES.includes(String(t));

const parseYearFromTags = (tags) => {
    if (!Array.isArray(tags)) return null;
    const hit = tags.find((t) => String(t).startsWith("year:"));
    if (!hit) return null;
    const y = String(hit).slice("year:".length).trim();
    return y || null;
};

const safeInt = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s) return null;

    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
};

const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const dayKeyToUTCDate = (dayKey) => {
    // dayKey: "YYYY-MM-DD"
    const [y, m, d] = String(dayKey).split("-").map((x) => Number.parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

const prevDayKey = (dayKey) => {
    const dt = dayKeyToUTCDate(dayKey);
    if (!dt) return dayKey;

    dt.setUTCDate(dt.getUTCDate() - 1);

    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const computeCurrentStreak = (completeDaySet, todayKey) => {
    let streak = 0;
    let cursor = todayKey;

    while (completeDaySet.has(cursor)) {
        streak += 1;
        cursor = prevDayKey(cursor);
    }

    return streak;
};

const getTodayDayKeyNY = () => {
    const now = new Date();

    const dtf = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return dtf.format(now);
};

const initTypeAgg = () => {
    return {
        count: 0,
        ratingSum: 0,
        ratingCount: 0,
        wordSum: 0,
        wordCount: 0,
    };
};

statsRouter.use(authRequired);

statsRouter.get("/", async (req, res, next) => {
    try {
        // Year can be "All" or a 4-digit year
        const rawYear = req.query.year ? String(req.query.year).trim() : "All";
        const selectedYear = rawYear || "All";

        if (selectedYear !== "All" && !/^\d{4}$/.test(selectedYear)) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        // Fetch minimal data to compute availableYears
        const allRowsForYears = await req.prisma.entry.findMany({
            where: {
                userId: req.userId,
                category: { in: TYPES },
            },
            select: {
                dayKey: true,
                tags: true,
                category: true,
            },
            orderBy: [{ dayKey: "desc" }],
        });

        const years = new Set();
        for (const e of allRowsForYears) {
            if (!isValidBradburyType(e.category)) continue;

            const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);
            if (y) years.add(String(y));
        }

        const availableYears = [...years].sort((a, b) => (a < b ? 1 : -1));

        // Fetch rows used for stats computation
        const whereForStats = {
            userId: req.userId,
            category: { in: TYPES },
            ...(selectedYear === "All" ? null : { dayKey: { startsWith: `${selectedYear}-` } }),
        };

        const rows = await req.prisma.entry.findMany({
            where: whereForStats,
            select: {
                dayKey: true,
                category: true,
                rating: true,
                wordCount: true,
                tags: true,
            },
            orderBy: [{ dayKey: "desc" }],
        });

        // Normalize rows
        const normalizedItems = rows
            .filter((e) => isValidBradburyType(e.category))
            .map((e) => {
                const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);

                return {
                    type: String(e.category),
                    year: y,
                    rating: safeNum(e.rating),
                    wordCount: safeInt(e.wordCount),
                    dayKey: String(e.dayKey || ""),
                };
            });

        // countsByType
        const countsByType = { essay: 0, story: 0, poem: 0 };
        for (const it of normalizedItems) {
            if (!Object.prototype.hasOwnProperty.call(countsByType, it.type)) continue;
            countsByType[it.type] += 1;
        }

        // totals: totalWords, avgRating, ratingCount
        let totalWords = 0;
        let totalRatings = 0;
        let ratingCount = 0;

        for (const it of normalizedItems) {
            if (it.wordCount != null) totalWords += it.wordCount;

            if (it.rating != null) {
                totalRatings += it.rating;
                ratingCount += 1;
            }
        }

        const avgRating = ratingCount > 0 ? totalRatings / ratingCount : null;

        const totals = {
            totalWords,
            avgRating,
            ratingCount,
        };

        // perTypeAverages
        const agg = {
            essay: initTypeAgg(),
            story: initTypeAgg(),
            poem: initTypeAgg(),
        };

        for (const it of normalizedItems) {
            if (!agg[it.type]) continue;

            agg[it.type].count += 1;

            if (it.rating != null) {
                agg[it.type].ratingSum += it.rating;
                agg[it.type].ratingCount += 1;
            }

            if (it.wordCount != null) {
                agg[it.type].wordSum += it.wordCount;
                agg[it.type].wordCount += 1;
            }
        }

        const perTypeAverages = {};
        for (const key of Object.keys(agg)) {
            const a = agg[key];
            perTypeAverages[key] = {
                count: a.count,
                avgRating: a.ratingCount > 0 ? a.ratingSum / a.ratingCount : null,
                avgWords: a.wordCount > 0 ? a.wordSum / a.wordCount : null,
                ratedCount: a.ratingCount,
                wordCount: a.wordCount,
            };
        }

        // challengeStreakStats
        const dayToTypes = new Map();
        for (const it of normalizedItems) {
            if (!it.dayKey) continue;
            if (!dayToTypes.has(it.dayKey)) dayToTypes.set(it.dayKey, new Set());
            dayToTypes.get(it.dayKey).add(it.type);
        }

        const completeDaySet = new Set();
        for (const [dayKey, typeSet] of dayToTypes.entries()) {
            if (typeSet.size === 3) completeDaySet.add(dayKey);
        }

        const completeDayCount = completeDaySet.size;

        const todayKeyNY = getTodayDayKeyNY();
        const currentStreak = computeCurrentStreak(completeDaySet, todayKeyNY);

        return res.json({
            ok: true,
            selectedYear,
            availableYears,
            challengeStreakStats: {
                completeDayCount,
                currentStreak,
            },
            countsByType,
            totals,
            perTypeAverages,
        });
    } catch (err) {
        return next(err);
    }
});

export { statsRouter };
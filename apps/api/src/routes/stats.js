const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { ReadingEntry, CATEGORIES } = require("../models/ReadingEntry");

const router = express.Router();

const APP_TIMEZONE = "America/New_York";

function todayDayKeyNY() {
  // en-CA yields YYYY-MM-DD (ISO-like) in most Node builds.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dayKeyAddDays(dayKey, deltaDays) {
  const [y, m, d] = String(dayKey).split("-").map((n) => Number(n));
  const ms = Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000;
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function avg(values) {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

const BADGES = [
  { days: 3, key: "streak_3", label: "3-Day Streak", description: "Three consecutive complete days." },
  { days: 7, key: "streak_7", label: "1-Week Streak", description: "Seven consecutive complete days." },
  { days: 14, key: "streak_14", label: "2-Week Streak", description: "Fourteen consecutive complete days." },
  { days: 30, key: "streak_30", label: "30-Day Streak", description: "Thirty consecutive complete days." },
  { days: 60, key: "streak_60", label: "60-Day Streak", description: "Sixty consecutive complete days." },
  { days: 100, key: "streak_100", label: "100-Day Streak", description: "One hundred consecutive complete days." },
];

function computeEarnedBadges(streakDays) {
  return BADGES.filter((b) => streakDays >= b.days);
}

function initCategoryBucket() {
  return {
    entriesCount: 0,
    totalWords: 0,
    ratings: [],
    avgRating: null,
  };
}

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Optional range filters for totals/averages
    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;

    const rangeQuery = { userId };
    if (from || to) {
      rangeQuery.dayKey = {};
      if (from) rangeQuery.dayKey.$gte = from;
      if (to) rangeQuery.dayKey.$lte = to;
    }

    // 1) Range-based entries for totals/averages
    const rangeEntries = await ReadingEntry.find(rangeQuery)
      .select("dayKey category rating wordCount")
      .lean();

    // Totals + per-category
    const perCategory = {
      essay: initCategoryBucket(),
      story: initCategoryBucket(),
      poem: initCategoryBucket(),
    };

    let totalEntries = 0;
    let totalWords = 0;
    const allRatings = [];

    for (const e of rangeEntries) {
      totalEntries += 1;
      if (typeof e.wordCount === "number" && Number.isFinite(e.wordCount)) {
        totalWords += e.wordCount;
      }
      if (typeof e.rating === "number" && Number.isFinite(e.rating)) {
        allRatings.push(e.rating);
      }

      const bucket = perCategory[e.category];
      if (bucket) {
        bucket.entriesCount += 1;
        if (typeof e.wordCount === "number" && Number.isFinite(e.wordCount)) {
          bucket.totalWords += e.wordCount;
        }
        if (typeof e.rating === "number" && Number.isFinite(e.rating)) {
          bucket.ratings.push(e.rating);
        }
      }
    }

    const averageRating = allRatings.length ? avg(allRatings) : null;

    for (const c of CATEGORIES) {
      const b = perCategory[c];
      b.avgRating = b.ratings.length ? avg(b.ratings) : null;
      delete b.ratings; // do not return raw arrays
    }

    // 2) Streak is computed on ALL entries (not range-limited)
    const allEntries = await ReadingEntry.find({ userId })
      .select("dayKey category")
      .lean();

    // Build a map of dayKey -> set(categories)
    const dayToCats = new Map();
    for (const e of allEntries) {
      const key = e.dayKey;
      if (!dayToCats.has(key)) dayToCats.set(key, new Set());
      dayToCats.get(key).add(e.category);
    }

    // Day is complete only if it has all 3 categories
    const completeDays = new Set();
    for (const [dayKey, catSet] of dayToCats.entries()) {
      if (catSet.has("essay") && catSet.has("story") && catSet.has("poem")) {
        completeDays.add(dayKey);
      }
    }

    const today = todayDayKeyNY();
    const yesterday = dayKeyAddDays(today, -1);

    let streakEnd = null;
    if (completeDays.has(today)) streakEnd = today;
    else if (completeDays.has(yesterday)) streakEnd = yesterday;

    let currentStreakDays = 0;
    if (streakEnd) {
      let cursor = streakEnd;
      while (completeDays.has(cursor)) {
        currentStreakDays += 1;
        cursor = dayKeyAddDays(cursor, -1);
      }
    }

    const earnedBadges = computeEarnedBadges(currentStreakDays);

    return res.json({
      ok: true,

      // Range-awareness (for all-time stats vs category- or date-specific)
      range: { from, to },
      totals: {
        entriesCount: totalEntries,
        totalWords,
        averageRating,
      },
      byCategory: perCategory,

      // Streak + badges
      streak: {
        basis: "all_time",
        todayDayKey: today,
        currentStreakDays,
      },
      badges: earnedBadges,
    });
  } catch (err) {
    console.error("[stats:summary] error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
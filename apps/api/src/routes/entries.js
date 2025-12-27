const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { ReadingEntry, CATEGORIES } = require("../models/ReadingEntry");

const router = express.Router();

function normalizeTag(value) {
  return String(value || "").trim().toLowerCase();
}

function toInt(value, fallback = null) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNumber(value, fallback = null) {
  const n = Number(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /entries
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { dayKey, category, tag, search, minRating, maxRating } = req.query;

    const query = { userId };

    if (dayKey) query.dayKey = String(dayKey);

    if (category) {
      const c = String(category);
      if (!CATEGORIES.includes(c)) {
        return res.status(400).json({ ok: false, error: "invalid_category" });
      }
      query.category = c;
    }

    if (tag) {
      query.tags = normalizeTag(tag);
    }

    const minR = toNumber(minRating);
    const maxR = toNumber(maxRating);
    if (minR !== null || maxR !== null) {
      query.rating = {};
      if (minR !== null) query.rating.$gte = minR;
      if (maxR !== null) query.rating.$lte = maxR;
    }

    // Prototype search
    if (search) {
      const s = String(search).trim();
      if (s) {
        const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ title: re }, { author: re }, { notes: re }];
      }
    }

    const items = await ReadingEntry.find(query)
      .sort({ dayKey: -1, category: 1, createdAt: -1 })
      .lean();

    return res.json({ ok: true, items });
  } catch (err) {
    console.error("[entries:get] error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/**
 * POST /entries
 * Body:
 *  {
 *    dayKey, category, title, author?, notes?, tags?, rating, wordCount?
 *  }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      dayKey,
      category,
      title,
      author = "",
      notes = "",
      tags = [],
      rating,
      wordCount,
    } = req.body || {};

    if (!dayKey || !category || !title || rating == null) {
      return res.status(400).json({ ok: false, error: "missing_required_fields" });
    }

    if (!CATEGORIES.includes(String(category))) {
      return res.status(400).json({ ok: false, error: "invalid_category" });
    }

    const entry = await ReadingEntry.create({
      userId,
      dayKey: String(dayKey),
      category: String(category),
      title: String(title).trim(),
      author: String(author || "").trim(),
      notes: String(notes || ""),
      tags: Array.isArray(tags) ? tags : [],
      rating: Number(rating),
      ...(wordCount !== undefined && wordCount !== null
        ? { wordCount: toInt(wordCount, undefined) }
        : {}),
    });

    return res.status(201).json({ ok: true, item: entry });
  } catch (err) {
    // Dupe key => user already logged category today
    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, error: "entry_already_exists_for_day_and_category" });
    }
    console.error("[entries:post] error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/**
 * PUT /entries/:id
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Only update this subset
    const allowed = [
      "dayKey",
      "category",
      "title",
      "author",
      "notes",
      "tags",
      "rating",
      "wordCount",
    ];

    const patch = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        patch[key] = req.body[key];
      }
    }

    if (patch.category && !CATEGORIES.includes(String(patch.category))) {
      return res.status(400).json({ ok: false, error: "invalid_category" });
    }

    if (patch.title !== undefined) patch.title = String(patch.title).trim();
    if (patch.author !== undefined) patch.author = String(patch.author || "").trim();
    if (patch.notes !== undefined) patch.notes = String(patch.notes || "");
    if (patch.tags !== undefined) patch.tags = Array.isArray(patch.tags) ? patch.tags : [];
    if (patch.rating !== undefined) patch.rating = Number(patch.rating);
    if (patch.dayKey !== undefined) patch.dayKey = String(patch.dayKey);

    if (patch.wordCount !== undefined) {
      patch.wordCount =
        patch.wordCount === null || patch.wordCount === ""
          ? undefined
          : toInt(patch.wordCount, undefined);
    }

    // Enforce ownership
    const updated = await ReadingEntry.findOneAndUpdate(
      { _id: id, userId },
      patch,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true, item: updated });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, error: "entry_already_exists_for_day_and_category" });
    }
    console.error("[entries:put] error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/**
 * DELETE /entries/:id
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const deleted = await ReadingEntry.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[entries:delete] error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
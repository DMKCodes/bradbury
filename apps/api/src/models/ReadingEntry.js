const mongoose = require("mongoose");

const CATEGORIES = ["essay", "story", "poem"];

const ReadingEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    dayKey: { type: String, required: true, index: true },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true, default: "" },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    rating: { type: Number, required: true, min: 1, max: 5 },
    wordCount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Normalize tags before save
ReadingEntrySchema.pre("save", function normalizeTags(next) {
  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean);

    // De-dupe, preserve order
    const seen = new Set();
    this.tags = this.tags.filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  }
  next();
});

ReadingEntrySchema.index(
  { userId: 1, dayKey: 1, category: 1 },
  { unique: true }
);
ReadingEntrySchema.index({ userId: 1, dayKey: 1 });
ReadingEntrySchema.index({ userId: 1, tags: 1 });

module.exports = {
  ReadingEntry: mongoose.model("ReadingEntry", ReadingEntrySchema),
  CATEGORIES,
};
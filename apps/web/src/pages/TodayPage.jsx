import React, { useEffect, useMemo, useState } from "react";
import {
    createEntry,
    deleteEntry,
    listEntries,
    updateEntry,
} from "../lib/api";

const CATEGORIES = [
    { key: "essay", label: "Essay (Nonfiction)" },
    { key: "story", label: "Short Story (Fiction)" },
    { key: "poem", label: "Poem" },
];

const APP_TIMEZONE = "America/New_York";

const getTodayDayKeyNY = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
};

const splitTags = (input) => {
    return String(input || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
};

const tagsToString = (tags) => {
    if (!Array.isArray(tags)) return "";
    return tags.join(", ");
};

const emptyForm = () => {
    return {
        title: "",
        author: "",
        tagsText: "",
        rating: "3",
        wordCount: "",
        notes: "",
    };
};

const normalizeWordCount = (value) => {
    const v = String(value || "").trim();
    if (!v) return null;

    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0) return null;

    return n;
};

const TodayPage = () => {
    const dayKey = useMemo(() => getTodayDayKeyNY(), []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [itemsByCategory, setItemsByCategory] = useState({
        essay: null,
        story: null,
        poem: null,
    });

    const [formsByCategory, setFormsByCategory] = useState({
        essay: emptyForm(),
        story: emptyForm(),
        poem: emptyForm(),
    });

    const [savingByCategory, setSavingByCategory] = useState({
        essay: false,
        story: false,
        poem: false,
    });

    const [saveErrorByCategory, setSaveErrorByCategory] = useState({
        essay: "",
        story: "",
        poem: "",
    });

    const [saveOkByCategory, setSaveOkByCategory] = useState({
        essay: false,
        story: false,
        poem: false,
    });

    const completedCount = useMemo(() => {
        return CATEGORIES.reduce((acc, c) => acc + (itemsByCategory[c.key] ? 1 : 0), 0);
    }, [itemsByCategory]);

    const isCompleteDay = completedCount === 3;

    const loadToday = async () => {
        setLoading(true);
        setError("");

        try {
            const items = await listEntries({ dayKey });

            const nextItemsByCategory = { essay: null, story: null, poem: null };
            for (const item of items) {
                if (nextItemsByCategory[item.category] == null) {
                    nextItemsByCategory[item.category] = item;
                }
            }

            const nextForms = {
                essay: emptyForm(),
                story: emptyForm(),
                poem: emptyForm(),
            };

            for (const c of CATEGORIES) {
                const existing = nextItemsByCategory[c.key];
                if (existing) {
                    nextForms[c.key] = {
                        title: existing.title || "",
                        author: existing.author || "",
                        tagsText: tagsToString(existing.tags),
                        rating: String(existing.rating ?? "3"),
                        wordCount: existing.wordCount == null ? "" : String(existing.wordCount),
                        notes: existing.notes || "",
                    };
                }
            }

            setItemsByCategory(nextItemsByCategory);
            setFormsByCategory(nextForms);
        } catch (err) {
            console.error(err);
            setError("Failed to load today's entries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadToday();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayKey]);

    const updateForm = (category, patch) => {
        setFormsByCategory((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                ...patch,
            },
        }));
    };

    const setSavingState = (category, isSaving) => {
        setSavingByCategory((prev) => ({ ...prev, [category]: isSaving }));
    };

    const setSaveError = (category, message) => {
        setSaveErrorByCategory((prev) => ({ ...prev, [category]: message }));
    };

    const setSaveOk = (category, isOk) => {
        setSaveOkByCategory((prev) => ({ ...prev, [category]: isOk }));
    };

    const handleSave = async (category) => {
        setSaveError(category, "");
        setSaveOk(category, false);

        const form = formsByCategory[category];

        if (!form.title.trim()) {
            setSaveError(category, "Title is required.");
            return;
        }

        const ratingNum = Number(form.rating);
        if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            setSaveError(category, "Rating must be between 1 and 5.");
            return;
        }

        const wordCountNum = normalizeWordCount(form.wordCount);

        const payload = {
            dayKey,
            category,
            title: form.title.trim(),
            author: form.author.trim(),
            notes: form.notes,
            tags: splitTags(form.tagsText),
            rating: ratingNum,
        };

        if (wordCountNum !== null) {
            payload.wordCount = wordCountNum;
        } else {
            // If empty/invalid, omit wordCount entirely
            payload.wordCount = null;
        }

        setSavingState(category, true);

        try {
            const existing = itemsByCategory[category];

            let saved;
            if (existing) {
                saved = await updateEntry(existing._id, payload);
            } else {
                saved = await createEntry(payload);
            }

            setItemsByCategory((prev) => ({
                ...prev,
                [category]: saved,
            }));

            setSaveOk(category, true);
            setTimeout(() => setSaveOk(category, false), 1200);
        } catch (err) {
            console.error(err);

            const message =
                err?.message === "entry_already_exists_for_day_and_category"
                    ? "An entry for this category already exists today."
                    : "Save failed. Please try again.";

            setSaveError(category, message);
        } finally {
            setSavingState(category, false);
        }
    };

    const handleDelete = async (category) => {
        const existing = itemsByCategory[category];
        if (!existing) return;

        setSaveError(category, "");
        setSaveOk(category, false);
        setSavingState(category, true);

        try {
            await deleteEntry(existing._id);

            setItemsByCategory((prev) => ({
                ...prev,
                [category]: null,
            }));

            setFormsByCategory((prev) => ({
                ...prev,
                [category]: emptyForm(),
            }));
        } catch (err) {
            console.error(err);
            setSaveError(category, "Delete failed. Please try again.");
        } finally {
            setSavingState(category, false);
        }
    };

    if (loading) {
        return <div style={{ padding: 8 }}>Loading…</div>;
    }

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div>
                    <h2 style={{ margin: 0 }}>Today</h2>
                    <div style={{ opacity: 0.8 }}>
                        Day: <code>{dayKey}</code>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div>
                        Completed: <strong>{completedCount}/3</strong>
                    </div>
                    <div style={{ opacity: 0.8 }}>
                        {isCompleteDay ? "Complete day logged." : "Still in progress."}
                    </div>
                </div>
            </div>

            {error ? (
                <div
                    style={{
                        padding: 10,
                        border: "1px solid #999",
                        borderRadius: 6,
                    }}
                >
                    {error}
                </div>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                }}
            >
                {CATEGORIES.map((c) => {
                    const existing = itemsByCategory[c.key];
                    const form = formsByCategory[c.key];
                    const saving = savingByCategory[c.key];
                    const saveErr = saveErrorByCategory[c.key];
                    const saveOk = saveOkByCategory[c.key];

                    return (
                        <section
                            key={c.key}
                            style={{
                                border: "1px solid #999",
                                borderRadius: 8,
                                padding: 12,
                                display: "grid",
                                gap: 10,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div>
                                    <strong>{c.label}</strong>
                                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                                        {existing ? "Saved" : "Not logged yet"}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {saveOk ? (
                                        <span style={{ fontSize: 12, opacity: 0.8 }}>Saved</span>
                                    ) : null}
                                </div>
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                                <span>Title</span>
                                <input
                                    value={form.title}
                                    onChange={(e) => updateForm(c.key, { title: e.target.value })}
                                    disabled={saving}
                                    placeholder="Title"
                                />
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                                <span>Author (optional)</span>
                                <input
                                    value={form.author}
                                    onChange={(e) => updateForm(c.key, { author: e.target.value })}
                                    disabled={saving}
                                    placeholder="Author"
                                />
                            </label>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 10,
                                    gridTemplateColumns: "1fr 120px",
                                }}
                            >
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span>Tags (comma-separated)</span>
                                    <input
                                        value={form.tagsText}
                                        onChange={(e) => updateForm(c.key, { tagsText: e.target.value })}
                                        disabled={saving}
                                        placeholder="genre, topic, theme"
                                    />
                                </label>

                                <label style={{ display: "grid", gap: 6 }}>
                                    <span>Rating</span>
                                    <select
                                        value={form.rating}
                                        onChange={(e) => updateForm(c.key, { rating: e.target.value })}
                                        disabled={saving}
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </label>
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                                <span>Estimated word count (optional)</span>
                                <input
                                    value={form.wordCount}
                                    onChange={(e) => updateForm(c.key, { wordCount: e.target.value })}
                                    disabled={saving}
                                    inputMode="numeric"
                                    placeholder="e.g., 2500"
                                />
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                                <span>Notes</span>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => updateForm(c.key, { notes: e.target.value })}
                                    disabled={saving}
                                    rows={4}
                                    placeholder="Thoughts, quotes, takeaways…"
                                />
                            </label>

                            {saveErr ? (
                                <div
                                    style={{
                                        padding: 10,
                                        border: "1px solid #999",
                                        borderRadius: 6,
                                    }}
                                >
                                    {saveErr}
                                </div>
                            ) : null}

                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => handleSave(c.key)}
                                    disabled={saving}
                                >
                                    {saving ? "Saving…" : existing ? "Update" : "Save"}
                                </button>

                                {existing ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(c.key)}
                                        disabled={saving}
                                    >
                                        Delete
                                    </button>
                                ) : null}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default TodayPage;

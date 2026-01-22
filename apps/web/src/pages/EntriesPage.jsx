import React, { useCallback, useEffect, useState } from "react";
import { listEntries, upsertEntry } from "../lib/api.js";
import { getTodayDayKeyLocal } from "../lib/date.js";

import AppShell from "../components/layout/AppShell.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";

import DayPicker from "../components/entries/DayPicker.jsx";
import EntrySummaryGrid from "../components/entries/EntrySummaryGrid.jsx";
import EntryEditorForm from "../components/entries/EntryEditorForm.jsx";

const coerceInt = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
};

const normalizeTags = (raw) => {
    const parts = String(raw || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const seen = new Set();
    const out = [];
    for (const t of parts) {
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(t);
    }
    return out;
};

const EntriesPage = () => {
    const [dayKey, setDayKey] = useState(() => getTodayDayKeyLocal());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [entries, setEntries] = useState([]);

    const [category, setCategory] = useState("essay");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [tagsRaw, setTagsRaw] = useState("");
    const [rating, setRating] = useState(5);
    const [wordCount, setWordCount] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await listEntries({ dayKey });
            const list = Array.isArray(res?.entries) ? res.entries : Array.isArray(res) ? res : [];
            setEntries(list);
        } catch (err) {
            setError(String(err?.message || err));
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [dayKey]);

    useEffect(() => {
        load();
    }, [load]);

    const startEditFromCategory = (catKey, entryOrNull) => {
        const e = entryOrNull;

        if (!e) {
            setCategory(catKey);
            setTitle("");
            setAuthor("");
            setUrl("");
            setNotes("");
            setTagsRaw("");
            setRating(5);
            setWordCount("");
            return;
        }

        setCategory(catKey);
        setTitle(String(e.title || ""));
        setAuthor(String(e.author || ""));
        setUrl(String(e.url || ""));
        setNotes(String(e.notes || ""));
        setTagsRaw(Array.isArray(e.tags) ? e.tags.join(", ") : "");
        setRating(Number.isFinite(e.rating) ? e.rating : 5);
        setWordCount(e.wordCount == null ? "" : String(e.wordCount));
    };

    const submit = async () => {
        setError("");

        const safeTitle = String(title || "").trim();
        if (!safeTitle) {
            setError("Title is required.");
            return;
        }

        const payload = {
            dayKey,
            category,
            title: safeTitle,
            author: String(author || ""),
            url: String(url || ""),
            notes: String(notes || ""),
            tags: normalizeTags(tagsRaw),
            rating: Number.isFinite(Number(rating)) ? Number(rating) : 5,
            wordCount: coerceInt(wordCount),
        };

        try {
            await upsertEntry(payload);
            await load();
        } catch (err) {
            setError(String(err?.message || err));
        }
    };

    return (
        <AppShell title="Log Readings" subtitle="Web alpha: day-based entries (essay/story/poem)">
            <DayPicker dayKey={dayKey} setDayKey={setDayKey} />

            <EntrySummaryGrid
                dayKey={dayKey}
                entries={entries}
                loading={loading}
                onPickCategory={startEditFromCategory}
            />

            <EntryEditorForm
                category={category}
                setCategory={setCategory}
                title={title}
                setTitle={setTitle}
                author={author}
                setAuthor={setAuthor}
                url={url}
                setUrl={setUrl}
                notes={notes}
                setNotes={setNotes}
                tagsRaw={tagsRaw}
                setTagsRaw={setTagsRaw}
                rating={rating}
                setRating={setRating}
                wordCount={wordCount}
                setWordCount={setWordCount}
                error={error}
                onSubmit={submit}
            />
        </AppShell>
    );
};

export default EntriesPage;
import React, { useMemo } from "react";

const CATEGORIES = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const EntrySummaryGrid = ({ dayKey, entries, loading, onPickCategory }) => {
    const entriesByCategory = useMemo(() => {
        const map = new Map();
        for (const c of CATEGORIES) map.set(c.key, null);

        for (const e of entries) {
            if (map.has(e.category)) map.set(e.category, e);
        }

        return map;
    }, [entries]);

    return (
        <div style={{ marginTop: 18, padding: 12, border: "1px solid #ccc" }}>
            <strong>Entries for {dayKey}</strong>
            {loading ? <div style={{ marginTop: 8 }}>Loading...</div> : null}

            {!loading && entries.length === 0 ? (
                <div style={{ marginTop: 8, opacity: 0.8 }}>No entries logged for this day.</div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                {CATEGORIES.map((c) => {
                    const e = entriesByCategory.get(c.key);

                    return (
                        <div key={c.key} style={{ flex: "1 1 260px", border: "1px solid #ddd", padding: 10 }}>
                            <div style={{ fontWeight: 800 }}>{c.label}</div>

                            <div style={{ marginTop: 6 }}>
                                {e ? (
                                    <>
                                        <div><strong>{e.title}</strong></div>
                                        <div style={{ opacity: 0.8 }}>{e.author ? `by ${e.author}` : "—"}</div>
                                        <div style={{ opacity: 0.8 }}>
                                            Rating: {e.rating ?? 5}/5{" "}
                                            {e.wordCount != null ? `• Words: ${e.wordCount}` : ""}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ opacity: 0.8 }}>Not logged</div>
                                )}
                            </div>

                            <button
                                onClick={() => onPickCategory(c.key, e)}
                                style={{ marginTop: 10, padding: 8 }}
                            >
                                {e ? "Edit" : "Log"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EntrySummaryGrid;

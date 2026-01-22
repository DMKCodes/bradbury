import React from "react";

const CATEGORIES = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const EntryEditorForm = ({
    category,
    setCategory,
    title,
    setTitle,
    author,
    setAuthor,
    url,
    setUrl,
    notes,
    setNotes,
    tagsRaw,
    setTagsRaw,
    rating,
    setRating,
    wordCount,
    setWordCount,
    error,
    onSubmit,
}) => {
    return (
        <div style={{ marginTop: 18, padding: 12, border: "1px solid #ccc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Upsert Entry</strong>
                <span style={{ opacity: 0.8 }}>Category: <strong>{category}</strong></span>
            </div>

            {error ? (
                <div style={{ marginTop: 10, padding: 10, border: "1px solid #ccc" }}>
                    {error}
                </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <label style={{ flex: "1 1 240px" }}>
                    <div>Category</div>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                </label>

                <label style={{ flex: "2 1 320px" }}>
                    <div>Title *</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "2 1 320px" }}>
                    <div>Author</div>
                    <input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "2 1 320px" }}>
                    <div>URL</div>
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "1 1 180px" }}>
                    <div>Rating (1–5)</div>
                    <input
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        type="number"
                        min="1"
                        max="5"
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "1 1 220px" }}>
                    <div>Word Count</div>
                    <input
                        value={wordCount}
                        onChange={(e) => setWordCount(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "1 1 100%", marginTop: 6 }}>
                    <div>Tags (comma-separated)</div>
                    <input
                        value={tagsRaw}
                        onChange={(e) => setTagsRaw(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>

                <label style={{ flex: "1 1 100%" }}>
                    <div>Notes</div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>
            </div>

            <button onClick={onSubmit} style={{ marginTop: 12, padding: 10 }}>
                Save (Upsert)
            </button>
        </div>
    );
};

export default EntryEditorForm;
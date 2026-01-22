import React, { useState } from "react";

const CATEGORY_OPTIONS = [
  { key: "essay", label: "Essay" },
  { key: "story", label: "Short Story" },
  { key: "poem", label: "Poem" },
];

const TopicItemForm = ({ busy, onAdd }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("essay");

  const submit = async (e) => {
    e.preventDefault();
    const safeTitle = String(title || "").trim();
    if (!safeTitle) return;

    await onAdd?.({
      title: safeTitle,
      url: String(url || "").trim(),
      category,
    });

    setTitle("");
    setUrl("");
    setCategory("essay");
  };

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Add item</div>

      <div className="field" style={{ marginBottom: 10 }}>
        <div className="label">Title *</div>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., The Design of Everyday Things"
        />
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <div className="label">URL (optional)</div>
        <input
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div className="label" style={{ marginBottom: 6 }}>Category</div>
        <div className="pillRow">
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`pill ${c.key === category ? "pill--active" : ""}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}{c.key === category ? " ✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Working..." : "Add Item"}
      </button>
    </form>
  );
};

export default TopicItemForm;
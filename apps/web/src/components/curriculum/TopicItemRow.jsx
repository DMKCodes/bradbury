import React from "react";

const CATEGORY_LABELS = {
  essay: "Essay",
  story: "Short Story",
  poem: "Poem",
};

const TopicItemRow = ({ item, onToggle, onDelete }) => {
  const finished = Boolean(item.finished);
  const label = CATEGORY_LABELS[item.category] || item.category;

  return (
    <div className="listItem" style={{ opacity: finished ? 0.75 : 1 }}>
      <div style={{ fontSize: 16, fontWeight: 900 }}>
        {finished ? "✓ " : ""}{item.title}
      </div>

      <div className="muted" style={{ marginTop: 4 }}>
        Category: {label}
      </div>

      {item.url ? (
        <div style={{ marginTop: 6 }}>
          <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" type="button" onClick={() => onToggle?.(item.id)}>
          {finished ? "Mark Unfinished" : "Mark Finished"}
        </button>
        <button className="btn" type="button" onClick={() => onDelete?.(item.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default TopicItemRow;
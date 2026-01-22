import React from "react";
import TopicItemRow from "./TopicItemRow.jsx";

const TopicItemList = ({ items, onToggle, onDelete }) => {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Items ({list.length})</div>

      {list.length === 0 ? (
        <div className="muted">No items yet. Add your first reading list item above.</div>
      ) : (
        <div className="list">
          {list.map((it) => (
            <TopicItemRow key={it.id} item={it} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicItemList;
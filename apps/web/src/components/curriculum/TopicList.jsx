import React from "react";
import { Link } from "react-router-dom";

const TopicList = ({ topics }) => {
  const list = Array.isArray(topics) ? topics : [];

  return (
    <div className="card">
      <div style={{ fontWeight: 900, marginBottom: 8 }}>
        Topics ({list.length})
      </div>

      {list.length === 0 ? (
        <div className="muted">No topics yet. Create your first one above.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {list.map((t) => (
            <li key={t.id}>
              <Link to={`/curriculum/topics/${t.id}`}>{t.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopicList;
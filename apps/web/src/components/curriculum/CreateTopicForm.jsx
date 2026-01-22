import React, { useState } from "react";

const CreateTopicForm = ({ busy, onCreate }) => {
  const [name, setName] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const safe = String(name || "").trim();
    if (!safe) return;
    await onCreate?.(safe);
    setName("");
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 12 }}>
      <div className="row">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New topic name"
          style={{ maxWidth: 420 }}
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Working..." : "Create Topic"}
        </button>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>
        Topics are your personal curriculum buckets (e.g., “Mechanical Engineering”).
      </div>
    </form>
  );
};

export default CreateTopicForm;
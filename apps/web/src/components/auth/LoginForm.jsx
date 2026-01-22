import React, { useState } from "react";

const LoginForm = ({ busy, error, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 520 }}>
      <div className="field" style={{ marginBottom: 10 }}>
        <div className="label">Email</div>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <div className="label">Password</div>
        <input
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
        />
      </div>

      {error ? <div className="error" style={{ marginBottom: 10 }}>{error}</div> : null}

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Working..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;
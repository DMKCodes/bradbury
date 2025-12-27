import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../lib/api";

const LoginPage = ({ user, setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const fromPath = location.state?.from || "/today";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (user) {
        return <Navigate to="/today" replace />;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError("Please enter both username and password.");
            return;
        }

        try {
            setSubmitting(true);
            const u = await login(username.trim(), password);
            setUser(u);
            navigate(fromPath, { replace: true });
        } catch (err) {
            // Prototype-grade error mapping
            const msg =
                err?.message === "invalid_credentials"
                    ? "Invalid username or password."
                    : "Login failed. Please try again.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
            <h1 style={{ marginBottom: 8 }}>Sign in</h1>
            <p style={{ marginTop: 0, opacity: 0.8 }}>
                Use the hardcoded credentials from <code>apps/api/.env</code>.
            </p>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                    <span>Username</span>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="doug"
                        disabled={submitting}
                    />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Password</span>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        type="password"
                        placeholder="••••••••"
                        disabled={submitting}
                    />
                </label>

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

                <button type="submit" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
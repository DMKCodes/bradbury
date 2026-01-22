import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api.js";

import AppShell from "../components/layout/AppShell.jsx";
import LoginForm from "../components/auth/LoginForm.jsx";

const LoginPage = () => {
    const nav = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async ({ email, password }) => {
        setBusy(true);
        setError("");

        try {
            await login({ email, password });
            nav("/curriculum", { replace: true });
        } catch (err) {
            console.error(err);
            setError(err?.message || "Login failed.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppShell title="Login" subtitle="Alpha test login.">
            <LoginForm busy={busy} error={error} onSubmit={handleSubmit} />
        </AppShell>
    );
};

export default LoginPage;
import React, { useEffect, useState } from "react";
import { me, logout } from "../lib/api.js";

import AppShell from "../components/layout/AppShell.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";
import UserCard from "../components/auth/UserCard.jsx";

const HomePage = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const run = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await me();
                if (controller.signal.aborted) return;
                setUser(res?.user || null);
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(String(err?.message || err));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        run();

        return () => controller.abort();
    }, []);

    const doLogout = () => {
        logout();
        onLogout?.();
    };

    return (
        <AppShell title="Bradbury Daily (Alpha)" subtitle="Account and environment sanity check.">
            <PageHeader
                title="Bradbury Daily (Alpha)"
                subtitle="Account and environment sanity check."
                right={<button onClick={doLogout} style={{ padding: 10 }}>Log out</button>}
            />

            {loading ? <p>Loading...</p> : null}

            {error ? (
                <div style={{ padding: 10, border: "1px solid #ccc", marginBottom: 10 }}>
                    {error}
                </div>
            ) : null}

            <UserCard user={user} />
        </AppShell>
    );
};

export default HomePage;
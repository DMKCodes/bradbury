import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import { authStorage, me, logout as apiLogout } from "./lib/api";

import LoginPage from "./pages/LoginPage";
import TodayPage from "./pages/TodayPage";
import StatsPage from "./pages/StatsPage";

const AppShell = ({ user, onLogout, children }) => {
    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                    <strong>Bradbury Challenge</strong>
                    <nav style={{ display: "flex", gap: 12 }}>
                        <Link to="/today">Today</Link>
                        <Link to="/stats">Stats</Link>
                    </nav>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ opacity: 0.8 }}>{user?.displayName}</span>
                    <button type="button" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </header>

            {children}
        </div>
    );
}

const ProtectedRoute = ({ user, children }) => {
    const location = useLocation();
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
}

const App = () => {
    const [user, setUser] = useState(() => authStorage.getUser());
    const [bootState, setBootState] = useState("booting"); // booting | ready

    const hasToken = useMemo(() => Boolean(authStorage.getToken()), []);

    useEffect(() => {
        let cancelled = false;

        async function boot() {
            // If token, attempt session restore
            if (authStorage.getToken()) {
                try {
                    const u = await me();
                    if (!cancelled) setUser(u);
                } catch {
                    // Token invalid/expired => clear storage
                    authStorage.clear();
                    if (!cancelled) setUser(null);
                }
            }
            if (!cancelled) setBootState("ready");
        }

        boot();
        return () => {
            cancelled = true;
        };
    }, [hasToken]);

    function handleLogout() {
        apiLogout();
        setUser(null);
    }

    if (bootState !== "ready") {
        return (
            <div style={{ padding: 24 }}>
                <div>Loading…</div>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage user={user} setUser={setUser} />}
            />

            <Route
                path="/today"
                element={
                    <ProtectedRoute user={user}>
                        <AppShell user={user} onLogout={handleLogout}>
                            <TodayPage user={user} />
                        </AppShell>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/stats"
                element={
                    <ProtectedRoute user={user}>
                        <AppShell user={user} onLogout={handleLogout}>
                            <StatsPage user={user} />
                        </AppShell>
                    </ProtectedRoute>
                }
            />

            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
    );
};

export default App;
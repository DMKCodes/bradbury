import React, { useEffect, useMemo, useState } from "react";
import { getStatsSummary } from "../lib/api";

const APP_TIMEZONE = "America/New_York";

const todayDayKeyNY = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
};

const dayKeyAddDays = (dayKey, deltaDays) => {
    const [y, m, d] = String(dayKey).split("-").map((n) => Number(n));
    const ms = Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000;
    const dt = new Date(ms);

    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
};

const formatNumber = (n) => {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return Number(n).toLocaleString();
};

const formatAvg = (n) => {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return Number(n).toFixed(2);
};

const StatCard = ({ title, children }) => {
    return (
        <section
            style={{
                border: "1px solid #999",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 8,
            }}
        >
            <strong>{title}</strong>
            <div>{children}</div>
        </section>
    );
};

const StatsPage = () => {
    const defaultTo = useMemo(() => todayDayKeyNY(), []);
    const defaultFrom = useMemo(() => dayKeyAddDays(defaultTo, -29), [defaultTo]); // last 30 days

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const load = async (range) => {
        setLoading(true);
        setError("");

        try {
            const result = await getStatsSummary(range);
            setData(result);
        } catch (err) {
            console.error(err);
            setError("Failed to load stats.");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load({ from, to });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onApplyRange = () => {
        load({ from, to });
    };

    const totals = data?.totals || {};
    const byCategory = data?.byCategory || {};
    const streak = data?.streak || {};
    const badges = Array.isArray(data?.badges) ? data.badges : [];

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div>
                    <h2 style={{ margin: 0 }}>Stats</h2>
                    <div style={{ opacity: 0.8 }}>
                        Current streak is computed across all-time complete days.
                    </div>
                </div>
            </div>

            <section
                style={{
                    border: "1px solid #999",
                    borderRadius: 8,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                }}
            >
                <strong>Range (affects totals/averages)</strong>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: 10,
                        alignItems: "end",
                        maxWidth: 560,
                    }}
                >
                    <label style={{ display: "grid", gap: 6 }}>
                        <span>From</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            disabled={loading}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <span>To</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            disabled={loading}
                        />
                    </label>

                    <button type="button" onClick={onApplyRange} disabled={loading}>
                        {loading ? "Loading…" : "Apply"}
                    </button>
                </div>
            </section>

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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 12,
                }}
            >
                <StatCard title="Current streak">
                    <div style={{ fontSize: 28, lineHeight: 1.1 }}>
                        {formatNumber(streak.currentStreakDays)}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                        day(s)
                    </div>
                </StatCard>

                <StatCard title="Total estimated words (range)">
                    <div style={{ fontSize: 28, lineHeight: 1.1 }}>
                        {formatNumber(totals.totalWords)}
                    </div>
                </StatCard>

                <StatCard title="Average star rating (range)">
                    <div style={{ fontSize: 28, lineHeight: 1.1 }}>
                        {formatAvg(totals.averageRating)}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                        across {formatNumber(totals.entriesCount)} entr{totals.entriesCount === 1 ? "y" : "ies"}
                    </div>
                </StatCard>
            </div>

            <section
                style={{
                    border: "1px solid #999",
                    borderRadius: 8,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                }}
            >
                <strong>By category (range)</strong>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                    }}
                >
                    <StatCard title="Essay (Nonfiction)">
                        <div>Entries: {formatNumber(byCategory.essay?.entriesCount)}</div>
                        <div>Total words: {formatNumber(byCategory.essay?.totalWords)}</div>
                        <div>Avg rating: {formatAvg(byCategory.essay?.avgRating)}</div>
                    </StatCard>

                    <StatCard title="Short Story (Fiction)">
                        <div>Entries: {formatNumber(byCategory.story?.entriesCount)}</div>
                        <div>Total words: {formatNumber(byCategory.story?.totalWords)}</div>
                        <div>Avg rating: {formatAvg(byCategory.story?.avgRating)}</div>
                    </StatCard>

                    <StatCard title="Poem">
                        <div>Entries: {formatNumber(byCategory.poem?.entriesCount)}</div>
                        <div>Total words: {formatNumber(byCategory.poem?.totalWords)}</div>
                        <div>Avg rating: {formatAvg(byCategory.poem?.avgRating)}</div>
                    </StatCard>
                </div>
            </section>

            <section
                style={{
                    border: "1px solid #999",
                    borderRadius: 8,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                }}
            >
                <strong>Badges earned</strong>

                {badges.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                        {badges.map((b) => (
                            <li key={b.key}>
                                <strong>{b.label}</strong>
                                <span style={{ opacity: 0.8 }}> — {b.description}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ opacity: 0.8 }}>
                        No badges yet. Complete consecutive days to earn streak badges.
                    </div>
                )}
            </section>
        </div>
    );
};

export default StatsPage;

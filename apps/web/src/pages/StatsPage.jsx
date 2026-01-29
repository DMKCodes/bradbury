import React, { useCallback, useEffect, useMemo, useState } from "react";

import AppShell from "../components/layout/AppShell.jsx";
import { getStats } from "../lib/api.js";

import YearSelector from "../components/stats/YearSelector.jsx";
import ChallengeStatsCard from "../components/stats/ChallengeStatsCard.jsx";
import CountsByTypeCard from "../components/stats/CountsByTypeCard.jsx";
import TotalsCard from "../components/stats/TotalsCard.jsx";
import PerTypeAveragesCard from "../components/stats/PerTypeAveragesCard.jsx";

/**
 * StatsPage
 *
 * Page controller for stats:
 * - loads stats from server
 * - manages year selection
 * - renders stats components
 *
 */

const StatsPage = () => {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const [selectedYear, setSelectedYear] = useState("All");
    const [stats, setStats] = useState(null);

    const availableYears = useMemo(() => {
        const raw = stats?.availableYears;
        return Array.isArray(raw) ? raw : [];
    }, [stats]);

    const load = useCallback(async (year) => {
        setBusy(true);
        setError("");

        try {
            const res = await getStats({ year });
            setStats(res || null);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to load stats.");
            setStats(null);
        } finally {
            setBusy(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load("All");
    }, [load]);

    const handleSelectYear = async (year) => {
        setSelectedYear(year);
        await load(year);
    };

    const challenge = stats?.challengeStreakStats || {};
    const countsByType = stats?.countsByType || {};
    const totals = stats?.totals || {};
    const perTypeAverages = stats?.perTypeAverages || {};

    return (
        <AppShell title="Stats" subtitle="Review your reading stats by year or all-time.">
            <YearSelector
                selectedYear={selectedYear}
                availableYears={availableYears}
                disabled={busy}
                onChange={handleSelectYear}
            />

            {loading ? <div>Loading…</div> : null}

            {error ? (
                <div className="card" style={{ marginBottom: 12 }}>
                    <div className="error">{error}</div>
                </div>
            ) : null}

            <ChallengeStatsCard challenge={challenge} />
            <CountsByTypeCard countsByType={countsByType} />
            <TotalsCard totals={totals} />
            <PerTypeAveragesCard perTypeAverages={perTypeAverages} />
        </AppShell>
    );
};

export default StatsPage;
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Button,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const StatBox = ({ title, value, subtitle }) => {
    return (
        <View
            style={{
                borderWidth: 1,
                borderColor: "#999",
                borderRadius: 10,
                padding: 12,
                gap: 6,
            }}
        >
            <Text style={{ fontWeight: "600" }}>{title}</Text>
            <Text style={{ fontSize: 26, fontWeight: "600" }}>{value}</Text>
            {subtitle ? <Text style={{ opacity: 0.7 }}>{subtitle}</Text> : null}
        </View>
    );
};

const StatsScreen = () => {
    const to = useMemo(() => todayDayKeyNY(), []);
    const from = useMemo(() => dayKeyAddDays(to, -29), [to]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getStatsSummary({ from, to });
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
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totals = data?.totals || {};
    const streak = data?.streak || {};
    const badges = Array.isArray(data?.badges) ? data.badges : [];

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Stats</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Totals/averages are for {from} to {to}. Streak is all-time.
                    </Text>
                </View>

                <Button title="Refresh" onPress={load} />

                {loading ? <ActivityIndicator /> : null}

                {error ? (
                    <View
                        style={{
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 10,
                            padding: 12,
                        }}
                    >
                        <Text>{error}</Text>
                    </View>
                ) : null}

                {!loading && !error ? (
                    <View style={{ gap: 12 }}>
                        <StatBox
                            title="Current streak"
                            value={formatNumber(streak.currentStreakDays)}
                            subtitle="Complete days in a row"
                        />
                        <StatBox
                            title="Total estimated words (range)"
                            value={formatNumber(totals.totalWords)}
                        />
                        <StatBox
                            title="Average rating (range)"
                            value={formatAvg(totals.averageRating)}
                            subtitle={`Across ${formatNumber(totals.entriesCount)} entries`}
                        />

                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "600" }}>Badges earned</Text>
                            {badges.length ? (
                                badges.map((b) => (
                                    <View key={b.key} style={{ gap: 2 }}>
                                        <Text style={{ fontWeight: "600" }}>{b.label}</Text>
                                        <Text style={{ opacity: 0.7 }}>{b.description}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ opacity: 0.7 }}>No badges yet.</Text>
                            )}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default StatsScreen;

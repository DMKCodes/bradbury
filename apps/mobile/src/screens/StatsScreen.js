import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Button, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getStatsSummary, getTodayDayKeyNY } from "../lib/store";

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

const TypeRow = ({ label, stats }) => {
    return (
        <View style={{ gap: 2 }}>
            <Text style={{ fontWeight: "700" }}>{label}</Text>
            <Text style={{ opacity: 0.7 }}>
                Finished: {formatNumber(stats?.entriesCount)} • Words: {formatNumber(stats?.totalWords)} • Avg:{" "}
                {formatAvg(stats?.avgRating)}
            </Text>
        </View>
    );
};

const StatsScreen = () => {
    const currentYear = useMemo(() => String(getTodayDayKeyNY()).slice(0, 4), []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const [selectedYear, setSelectedYear] = useState("global"); // "global" or "YYYY"

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getStatsSummary({});
            setData(result);

            // Default selection: current year if present, else global
            const years = Array.isArray(result?.availableYears) ? result.availableYears : [];
            if (years.includes(currentYear)) {
                setSelectedYear(currentYear);
            } else {
                setSelectedYear("global");
            }
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

    const availableYears = Array.isArray(data?.availableYears) ? data.availableYears : [];

    const activeStats =
        selectedYear === "global"
            ? data?.global
            : data?.byYear && data.byYear[selectedYear]
                ? data.byYear[selectedYear]
                : data?.global;

    const totals = activeStats?.totals || {};
    const byType = activeStats?.byType || {};

    const streak = data?.streak || {};
    const badges = Array.isArray(data?.badges) ? data.badges : [];

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Stats</Text>
                    <Text style={{ opacity: 0.7 }}>
                        View global (all years) or a single year. “Finished” counts reflect saved readings.
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
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 10,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>Scope</Text>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                <Pressable
                                    onPress={() => setSelectedYear("global")}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 999,
                                        backgroundColor: selectedYear === "global" ? "#ddd" : "transparent",
                                    }}
                                >
                                    <Text style={{ fontWeight: "600" }}>All years</Text>
                                </Pressable>

                                {availableYears.map((y) => (
                                    <Pressable
                                        key={y}
                                        onPress={() => setSelectedYear(y)}
                                        style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: "#999",
                                            borderRadius: 999,
                                            backgroundColor: selectedYear === y ? "#ddd" : "transparent",
                                        }}
                                    >
                                        <Text style={{ fontWeight: "600" }}>{y}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <StatBox
                            title="Current streak"
                            value={formatNumber(streak.currentStreakDays)}
                            subtitle="Complete days in a row (essay + story + poem)"
                        />

                        <StatBox title="Finished readings" value={formatNumber(totals.entriesCount)} />

                        <StatBox title="Total estimated words" value={formatNumber(totals.totalWords)} />

                        <StatBox title="Average rating" value={formatAvg(totals.averageRating)} />

                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>Finished by content type</Text>

                            <TypeRow label="Essay" stats={byType.essay} />
                            <TypeRow label="Short Story" stats={byType.short_story} />
                            <TypeRow label="Poem" stats={byType.poem} />
                            <TypeRow label="Book" stats={byType.book} />
                        </View>

                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>Badges earned</Text>
                            {badges.length ? (
                                badges.map((b) => (
                                    <View key={b.key} style={{ gap: 2 }}>
                                        <Text style={{ fontWeight: "700" }}>{b.label}</Text>
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
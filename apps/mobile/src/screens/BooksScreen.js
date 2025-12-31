import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTodayDayKeyNY, listEntries } from "../lib/store";
import { listBooks } from "../lib/booksStore";
import { Colors, GlobalStyles } from "../theme/theme";

const TYPE_LABELS = {
    essay: "Essay",
    story: "Short Story",
    poem: "Poem",
    book: "Book",
};

const isValidBradburyType = (t) => ["essay", "story", "poem"].includes(t);

const parseYearFromTags = (tags) => {
    if (!Array.isArray(tags)) return null;
    const hit = tags.find((t) => String(t).startsWith("year:"));
    if (!hit) return null;
    const y = String(hit).slice("year:".length).trim();
    return y || null;
};

const safeInt = (v) => {
    const n = Number.parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
};

const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const dayKeyToUTCDate = (dayKey) => {
    const [y, m, d] = String(dayKey).split("-").map((x) => Number.parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

const prevDayKey = (dayKey) => {
    const dt = dayKeyToUTCDate(dayKey);
    if (!dt) return dayKey;

    dt.setUTCDate(dt.getUTCDate() - 1);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const computeCurrentStreak = (completeDaySet, todayKey) => {
    let streak = 0;
    let cursor = todayKey;

    while (completeDaySet.has(cursor)) {
        streak += 1;
        cursor = prevDayKey(cursor);
    }

    return streak;
};

const initTypeAgg = () => {
    return {
        count: 0,
        ratingSum: 0,
        ratingCount: 0,
        wordSum: 0,
        wordCount: 0,
    };
};

const StatsScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedYear, setSelectedYear] = useState("All");

    const [challengeEntries, setChallengeEntries] = useState([]);
    const [books, setBooks] = useState([]);

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const allEntries = await listEntries({});
            const onlyChallenge = (allEntries || []).filter((e) => isValidBradburyType(e.category));
            setChallengeEntries(onlyChallenge);

            const allBooks = await listBooks({});
            setBooks(allBooks || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load stats data.");
            setChallengeEntries([]);
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set();

        for (const e of challengeEntries) {
            const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);
            if (y) years.add(String(y));
        }

        for (const b of books) {
            const y = String(b.year || "").trim();
            if (y) years.add(y);
        }

        return [...years].sort((a, b) => (a < b ? 1 : -1));
    }, [challengeEntries, books]);

    const yearFilteredChallenge = useMemo(() => {
        if (selectedYear === "All") return challengeEntries;

        return challengeEntries.filter((e) => {
            const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);
            return String(y) === String(selectedYear);
        });
    }, [challengeEntries, selectedYear]);

    const yearFilteredBooks = useMemo(() => {
        if (selectedYear === "All") return books;
        return books.filter((b) => String(b.year) === String(selectedYear));
    }, [books, selectedYear]);

    const unifiedItems = useMemo(() => {
        const fromChallenge = yearFilteredChallenge.map((e) => {
            const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);

            return {
                kind: "challenge",
                type: e.category,
                year: y,
                rating: safeNum(e.rating),
                wordCount: safeInt(e.wordCount),
            };
        });

        const fromBooks = yearFilteredBooks.map((b) => {
            return {
                kind: "book",
                type: "book",
                year: b.year,
                rating: safeNum(b.rating),
                wordCount: safeInt(b.wordCount),
            };
        });

        return [...fromChallenge, ...fromBooks];
    }, [yearFilteredChallenge, yearFilteredBooks]);

    const countsByType = useMemo(() => {
        const counts = { essay: 0, story: 0, poem: 0, book: 0 };
        for (const it of unifiedItems) {
            if (counts[it.type] == null) continue;
            counts[it.type] += 1;
        }
        return counts;
    }, [unifiedItems]);

    const totals = useMemo(() => {
        let totalWords = 0;
        let totalRatings = 0;
        let ratingCount = 0;

        for (const it of unifiedItems) {
            if (it.wordCount != null) totalWords += it.wordCount;

            if (it.rating != null) {
                totalRatings += it.rating;
                ratingCount += 1;
            }
        }

        const avgRating = ratingCount > 0 ? totalRatings / ratingCount : null;

        return {
            totalWords,
            avgRating,
            ratingCount,
        };
    }, [unifiedItems]);

    const perTypeAverages = useMemo(() => {
        const agg = {
            essay: initTypeAgg(),
            story: initTypeAgg(),
            poem: initTypeAgg(),
            book: initTypeAgg(),
        };

        for (const it of unifiedItems) {
            if (!agg[it.type]) continue;

            agg[it.type].count += 1;

            if (it.rating != null) {
                agg[it.type].ratingSum += it.rating;
                agg[it.type].ratingCount += 1;
            }

            if (it.wordCount != null) {
                agg[it.type].wordSum += it.wordCount;
                agg[it.type].wordCount += 1;
            }
        }

        const out = {};
        for (const key of Object.keys(agg)) {
            const a = agg[key];
            out[key] = {
                count: a.count,
                avgRating: a.ratingCount > 0 ? a.ratingSum / a.ratingCount : null,
                avgWords: a.wordCount > 0 ? a.wordSum / a.wordCount : null,
                ratedCount: a.ratingCount,
                wordsCount: a.wordCount,
            };
        }

        return out;
    }, [unifiedItems]);

    const challengeStreakStats = useMemo(() => {
        const dayToTypes = new Map();

        for (const e of yearFilteredChallenge) {
            const dayKey = e.dayKey;
            if (!dayKey) continue;

            if (!dayToTypes.has(dayKey)) {
                dayToTypes.set(dayKey, new Set());
            }
            dayToTypes.get(dayKey).add(e.category);
        }

        const completeDays = new Set();
        for (const [dayKey, types] of dayToTypes.entries()) {
            if (types.has("essay") && types.has("story") && types.has("poem")) {
                completeDays.add(dayKey);
            }
        }

        const todayKey = getTodayDayKeyNY();
        const currentStreak = computeCurrentStreak(completeDays, todayKey);

        return {
            completeDayCount: completeDays.size,
            currentStreak,
        };
    }, [yearFilteredChallenge]);

    const formatAvg = (n) => {
        if (n == null) return "—";
        return n.toFixed(2);
    };

    const formatAvgWords = (n) => {
        if (n == null) return "—";
        return Math.round(n).toLocaleString();
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Stats</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Books are included in totals and per-type averages. Streak is Bradbury-only.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Year</Text>

                    <View style={GlobalStyles.dividerRow}>
                        <Pressable
                            onPress={() => setSelectedYear("All")}
                            style={[
                                GlobalStyles.pill,
                                selectedYear === "All" ? GlobalStyles.pillSelected : null,
                            ]}
                        >
                            <Text style={{ fontWeight: "800", color: Colors.text }}>All</Text>
                        </Pressable>

                        {availableYears.map((y) => (
                            <Pressable
                                key={y}
                                onPress={() => setSelectedYear(y)}
                                style={[
                                    GlobalStyles.pill,
                                    selectedYear === y ? GlobalStyles.pillSelected : null,
                                ]}
                            >
                                <Text style={{ fontWeight: "800", color: Colors.text }}>{y}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {loading ? <ActivityIndicator /> : null}

                {error ? (
                    <View style={GlobalStyles.card}>
                        <Text style={GlobalStyles.text}>{error}</Text>
                    </View>
                ) : null}

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Bradbury Challenge</Text>

                    <Text style={GlobalStyles.muted}>
                        Current streak:{" "}
                        <Text style={{ fontWeight: "800", color: Colors.text }}>
                            {challengeStreakStats.currentStreak}
                        </Text>
                    </Text>

                    <Text style={GlobalStyles.muted}>
                        Completed days (essay + story + poem):{" "}
                        <Text style={{ fontWeight: "800", color: Colors.text }}>
                            {challengeStreakStats.completeDayCount}
                        </Text>
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Finished counts</Text>

                    {Object.keys(TYPE_LABELS).map((k) => (
                        <Text key={k} style={GlobalStyles.muted}>
                            {TYPE_LABELS[k]}:{" "}
                            <Text style={{ fontWeight: "800", color: Colors.text }}>
                                {countsByType[k] || 0}
                            </Text>
                        </Text>
                    ))}
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Totals (including books)</Text>

                    <Text style={GlobalStyles.muted}>
                        Total estimated words:{" "}
                        <Text style={{ fontWeight: "800", color: Colors.text }}>
                            {totals.totalWords.toLocaleString()}
                        </Text>
                    </Text>

                    <Text style={GlobalStyles.muted}>
                        Average rating:{" "}
                        <Text style={{ fontWeight: "800", color: Colors.text }}>
                            {formatAvg(totals.avgRating)}
                        </Text>{" "}
                        <Text style={{ color: Colors.mutedText }}>
                            ({totals.ratingCount} rated item(s))
                        </Text>
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Per-type averages</Text>

                    {Object.keys(TYPE_LABELS).map((k) => {
                        const a = perTypeAverages[k];

                        return (
                            <View
                                key={k}
                                style={{
                                    borderTopWidth: k === "essay" ? 0 : 1,
                                    borderTopColor: Colors.border,
                                    paddingTop: k === "essay" ? 0 : 10,
                                    gap: 4,
                                }}
                            >
                                <Text style={{ fontWeight: "800", color: Colors.text }}>
                                    {TYPE_LABELS[k]}
                                </Text>

                                <Text style={GlobalStyles.muted}>
                                    Avg rating:{" "}
                                    <Text style={{ fontWeight: "800", color: Colors.text }}>
                                        {formatAvg(a.avgRating)}
                                    </Text>{" "}
                                    <Text style={{ color: Colors.mutedText }}>
                                        ({a.ratedCount} rated / {a.count} total)
                                    </Text>
                                </Text>

                                <Text style={GlobalStyles.muted}>
                                    Avg words:{" "}
                                    <Text style={{ fontWeight: "800", color: Colors.text }}>
                                        {formatAvgWords(a.avgWords)}
                                    </Text>{" "}
                                    <Text style={{ color: Colors.mutedText }}>
                                        ({a.wordsCount} with word counts / {a.count} total)
                                    </Text>
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StatsScreen;
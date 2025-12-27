import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { listEntries } from "../lib/api";

const CATEGORIES = [
    { key: "", label: "All" },
    { key: "essay", label: "Essay" },
    { key: "story", label: "Story" },
    { key: "poem", label: "Poem" },
];

const clampRating = (value) => {
    const n = Number.parseInt(String(value || ""), 10);
    if (!Number.isFinite(n)) return "";
    if (n < 1) return "1";
    if (n > 5) return "5";
    return String(n);
};

const HistoryScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [items, setItems] = useState([]);

    // Filters
    const [category, setCategory] = useState("");
    const [tag, setTag] = useState("");
    const [search, setSearch] = useState("");
    const [minRating, setMinRating] = useState("");

    const queryParams = useMemo(() => {
        const params = {};
        if (category) params.category = category;
        if (tag.trim()) params.tag = tag.trim();
        if (search.trim()) params.search = search.trim();
        if (minRating) params.minRating = minRating;
        return params;
    }, [category, tag, search, minRating]);

    const load = async (params) => {
        setLoading(true);
        setError("");

        try {
            const result = await listEntries(params);
            setItems(result);
        } catch (err) {
            console.error(err);
            setError("Failed to load entries.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(queryParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = () => {
        load(queryParams);
    };

    const clearFilters = () => {
        setCategory("");
        setTag("");
        setSearch("");
        setMinRating("");
        load({});
    };

    const categoryLabel = (key) => {
        const found = CATEGORIES.find((c) => c.key === key);
        return found ? found.label : key;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>History</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Search and filter across all logged entries.
                    </Text>
                </View>

                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#999",
                        borderRadius: 10,
                        padding: 12,
                        gap: 10,
                    }}
                >
                    <Text style={{ fontWeight: "700" }}>Filters</Text>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Category</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {CATEGORIES.map((c) => {
                                const selected = category === c.key;
                                return (
                                    <Pressable
                                        key={c.key || "all"}
                                        onPress={() => setCategory(c.key)}
                                        style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: "#999",
                                            borderRadius: 999,
                                            backgroundColor: selected ? "#ddd" : "transparent",
                                        }}
                                    >
                                        <Text style={{ fontWeight: "600" }}>{c.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Tag</Text>
                        <TextInput
                            value={tag}
                            onChangeText={setTag}
                            placeholder="e.g., horror"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                            }}
                        />
                        <Text style={{ opacity: 0.7, fontSize: 12 }}>
                            Tags are stored lowercase; matching is exact.
                        </Text>
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Search</Text>
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="title, author, notes..."
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                            }}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Min rating (1–5)</Text>
                        <TextInput
                            value={minRating}
                            onChangeText={(v) => setMinRating(clampRating(v))}
                            placeholder="e.g., 4"
                            keyboardType="number-pad"
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                                maxWidth: 120,
                            }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable
                            onPress={applyFilters}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>Apply</Text>
                        </Pressable>

                        <Pressable
                            onPress={clearFilters}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>Clear</Text>
                        </Pressable>
                    </View>
                </View>

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
                    <View style={{ gap: 10 }}>
                        <Text style={{ opacity: 0.7 }}>
                            Showing {items.length} entr{items.length === 1 ? "y" : "ies"}.
                        </Text>

                        {items.map((x) => {
                            return (
                                <View
                                    key={x._id}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 10,
                                        padding: 12,
                                        gap: 4,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            gap: 10,
                                        }}
                                    >
                                        <Text style={{ fontWeight: "800" }}>
                                            {categoryLabel(x.category)}
                                        </Text>
                                        <Text style={{ opacity: 0.7 }}>{x.dayKey}</Text>
                                    </View>

                                    <Text style={{ fontSize: 16, fontWeight: "600" }}>
                                        {x.title}
                                    </Text>

                                    {x.author ? (
                                        <Text style={{ opacity: 0.8 }}>
                                            {x.author}
                                        </Text>
                                    ) : null}

                                    <Text style={{ opacity: 0.7 }}>
                                        Rating: {x.rating}
                                        {x.wordCount != null ? ` • Words: ${x.wordCount}` : ""}
                                    </Text>

                                    {Array.isArray(x.tags) && x.tags.length ? (
                                        <Text style={{ opacity: 0.7 }}>
                                            Tags: {x.tags.join(", ")}
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}

                        {!items.length ? (
                            <Text style={{ opacity: 0.7 }}>
                                No entries match the current filters.
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default HistoryScreen;
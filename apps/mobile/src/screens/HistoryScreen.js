import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { deleteEntryForDayCategory, listEntries, upsertEntryForDayCategory } from "../lib/store";
import { Colors, GlobalStyles } from "../theme/theme";

const CATEGORIES = [
    { key: "All", label: "All" },
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const isValidCategory = (c) => ["essay", "story", "poem"].includes(c);

const parseYearFromTags = (tags) => {
    if (!Array.isArray(tags)) return null;
    const hit = tags.find((t) => String(t).startsWith("year:"));
    if (!hit) return null;
    const y = String(hit).slice("year:".length).trim();
    return y || null;
};

const tagsToText = (tags) => {
    if (!Array.isArray(tags)) return "";
    const userTags = tags.filter(
        (t) => !String(t).startsWith("year:") && !String(t).startsWith("type:")
    );
    return userTags.join(", ");
};

const parseTagsText = (text) => {
    return String(text || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
};

const HistoryScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedYear, setSelectedYear] = useState("All");

    const [entries, setEntries] = useState([]);

    const [editing, setEditing] = useState(null); // { dayKey, category }
    const [editTitle, setEditTitle] = useState("");
    const [editAuthor, setEditAuthor] = useState("");
    const [editTagsText, setEditTagsText] = useState("");
    const [editRating, setEditRating] = useState(5);
    const [editWordCount, setEditWordCount] = useState("");
    const [editNotes, setEditNotes] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const all = await listEntries({});
            const onlyChallenge = (all || []).filter((e) => isValidCategory(e.category));
            const sorted = [...onlyChallenge].sort((a, b) => {
                const ad = String(a.dayKey || "");
                const bd = String(b.dayKey || "");
                if (ad !== bd) return ad < bd ? 1 : -1;
                return String(a.category || "") < String(b.category || "") ? -1 : 1;
            });

            setEntries(sorted);
        } catch (err) {
            console.error(err);
            setError("Failed to load history.");
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set();
        for (const e of entries) {
            const y = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);
            if (y) years.add(String(y));
        }
        return [...years].sort((a, b) => (a < b ? 1 : -1));
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter((e) => {
            const catOk = selectedCategory === "All" ? true : e.category === selectedCategory;

            const entryYear = parseYearFromTags(e.tags) || (e.dayKey ? String(e.dayKey).slice(0, 4) : null);
            const yearOk = selectedYear === "All" ? true : String(entryYear) === String(selectedYear);

            return catOk && yearOk;
        });
    }, [entries, selectedCategory, selectedYear]);

    const openEdit = (e) => {
        setEditing({ dayKey: e.dayKey, category: e.category });

        setEditTitle(e.title || "");
        setEditAuthor(e.author || "");
        setEditTagsText(tagsToText(e.tags));
        setEditRating(Number(e.rating || 5));
        setEditWordCount(e.wordCount == null ? "" : String(e.wordCount));
        setEditNotes(e.notes || "");
    };

    const closeEdit = () => {
        setEditing(null);
        setEditTitle("");
        setEditAuthor("");
        setEditTagsText("");
        setEditRating(5);
        setEditWordCount("");
        setEditNotes("");
    };

    const saveEdit = async () => {
        if (!editing) return;

        const safeTitle = String(editTitle || "").trim();
        if (!safeTitle) {
            Alert.alert("Missing title", "Please enter a title.");
            return;
        }

        try {
            await upsertEntryForDayCategory({
                dayKey: editing.dayKey,
                category: editing.category,
                title: safeTitle,
                author: editAuthor,
                notes: editNotes,
                tags: parseTagsText(editTagsText),
                rating: editRating,
                wordCount: editWordCount,
            });

            closeEdit();
            load();
        } catch (err) {
            console.error(err);
            Alert.alert("Save failed", "Unable to update this entry.");
        }
    };

    const deleteEntry = async (e) => {
        Alert.alert(
            "Delete entry?",
            `Delete ${e.category} on ${e.dayKey}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteEntryForDayCategory({ dayKey: e.dayKey, category: e.category });
                            load();
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Delete failed", "Unable to delete this entry.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>History</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Browse and edit your essay/story/poem logs across years.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Category</Text>
                    <View style={GlobalStyles.dividerRow}>
                        {CATEGORIES.map((c) => (
                            <Pressable
                                key={c.key}
                                onPress={() => setSelectedCategory(c.key)}
                                style={[
                                    GlobalStyles.pill,
                                    selectedCategory === c.key ? GlobalStyles.pillSelected : null,
                                ]}
                            >
                                <Text style={{ fontWeight: "800", color: Colors.text }}>{c.label}</Text>
                            </Pressable>
                        ))}
                    </View>
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

                {loading ? (
                    <View style={GlobalStyles.card}>
                        <Text style={GlobalStyles.muted}>Loading...</Text>
                    </View>
                ) : null}

                {error ? (
                    <View style={GlobalStyles.card}>
                        <Text style={GlobalStyles.text}>{error}</Text>
                    </View>
                ) : null}

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>
                        Entries ({filteredEntries.length})
                    </Text>

                    {filteredEntries.length === 0 ? (
                        <Text style={GlobalStyles.muted}>
                            No entries for this filter.
                        </Text>
                    ) : null}

                    {filteredEntries.map((e) => (
                        <View
                            key={`${e.dayKey}_${e.category}`}
                            style={{
                                borderTopWidth: 1,
                                borderTopColor: Colors.border,
                                paddingTop: 10,
                                gap: 6,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                                {e.title}
                            </Text>

                            <Text style={GlobalStyles.muted}>
                                {e.dayKey} • {e.category}
                                {e.rating != null ? ` • Rating: ${e.rating}` : ""}
                                {e.wordCount != null ? ` • Words: ${e.wordCount}` : ""}
                            </Text>

                            {e.author ? (
                                <Text style={GlobalStyles.muted}>{e.author}</Text>
                            ) : null}

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable onPress={() => openEdit(e)} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Edit</Text>
                                </Pressable>

                                <Pressable onPress={() => deleteEntry(e)} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>

                {editing ? (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: Colors.overlay,
                            padding: 16,
                            justifyContent: "center",
                        }}
                    >
                        <View style={GlobalStyles.card}>
                            <Text style={[GlobalStyles.label, { fontSize: 18 }]}>Edit entry</Text>
                            <Text style={GlobalStyles.muted}>
                                {editing.dayKey} • {editing.category}
                            </Text>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Title *</Text>
                                <TextInput
                                    value={editTitle}
                                    onChangeText={setEditTitle}
                                    placeholder="Title"
                                    placeholderTextColor={Colors.mutedText}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Author</Text>
                                <TextInput
                                    value={editAuthor}
                                    onChangeText={setEditAuthor}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Tags</Text>
                                <TextInput
                                    value={editTagsText}
                                    onChangeText={setEditTagsText}
                                    placeholder="comma-separated"
                                    placeholderTextColor={Colors.mutedText}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Rating</Text>
                                <View style={GlobalStyles.dividerRow}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Pressable
                                            key={n}
                                            onPress={() => setEditRating(n)}
                                            style={[
                                                GlobalStyles.pill,
                                                editRating === n ? GlobalStyles.pillSelected : null,
                                            ]}
                                        >
                                            <Text style={{ fontWeight: "800", color: Colors.text }}>{n}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Estimated word count</Text>
                                <TextInput
                                    value={editWordCount}
                                    onChangeText={setEditWordCount}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    keyboardType="number-pad"
                                    style={[GlobalStyles.input, { maxWidth: 180 }]}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Notes</Text>
                                <TextInput
                                    value={editNotes}
                                    onChangeText={setEditNotes}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    multiline
                                    style={[GlobalStyles.input, { minHeight: 90, textAlignVertical: "top" }]}
                                />
                            </View>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable onPress={saveEdit} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Save</Text>
                                </Pressable>

                                <Pressable onPress={closeEdit} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Cancel</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default HistoryScreen;
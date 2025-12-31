import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    deleteEntryForDayCategory,
    getTodayDayKeyNY,
    listEntries,
    upsertEntryForDayCategory,
} from "../lib/store";

import { Colors, GlobalStyles } from "../theme/theme";

const PREFILL_KEY = "bradbury_log_prefill_v1";

const CATEGORIES = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const categoryLabel = (key) => {
    const found = CATEGORIES.find((c) => c.key === key);
    return found ? found.label : key;
};

const parseTagsText = (text) => {
    return String(text || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
};

const tagsToText = (tags) => {
    if (!Array.isArray(tags)) return "";
    const userTags = tags.filter(
        (t) => !String(t).startsWith("year:") && !String(t).startsWith("type:")
    );
    return userTags.join(", ");
};

const isValidCategory = (c) => ["essay", "story", "poem"].includes(c);

const LogScreen = () => {
    const route = useRoute();

    const dayKey = useMemo(() => getTodayDayKeyNY(), []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [selectedCategory, setSelectedCategory] = useState("essay");
    const [isEditing, setIsEditing] = useState(true);

    const [todayEntries, setTodayEntries] = useState({
        essay: null,
        story: null,
        poem: null,
    });

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [rating, setRating] = useState(5);
    const [wordCount, setWordCount] = useState("");
    const [notes, setNotes] = useState("");

    const [pendingPrefill, setPendingPrefill] = useState(null);

    const loadToday = async () => {
        setLoading(true);
        setError("");

        try {
            const items = await listEntries({ dayKey });
            const next = { essay: null, story: null, poem: null };

            for (const e of items) {
                if (e.category === "essay") next.essay = e;
                if (e.category === "story") next.story = e;
                if (e.category === "poem") next.poem = e;
            }

            setTodayEntries(next);
        } catch (err) {
            console.error(err);
            setError("Failed to load today’s entries.");
        } finally {
            setLoading(false);
        }
    };

    const prefillFromEntry = (entry) => {
        if (!entry) {
            setTitle("");
            setAuthor("");
            setTagsText("");
            setRating(5);
            setWordCount("");
            setNotes("");
            return;
        }

        setTitle(entry.title || "");
        setAuthor(entry.author || "");
        setTagsText(tagsToText(entry.tags));
        setRating(Number(entry.rating || 5));
        setWordCount(entry.wordCount == null ? "" : String(entry.wordCount));
        setNotes(entry.notes || "");
    };

    useEffect(() => {
        loadToday();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const existing = todayEntries[selectedCategory] || null;

        setIsEditing(!existing);
        prefillFromEntry(existing);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, todayEntries.essay, todayEntries.story, todayEntries.poem]);

    useEffect(() => {
        if (!pendingPrefill) return;
        if (pendingPrefill.category !== selectedCategory) return;

        setIsEditing(true);
        setWordCount(String(pendingPrefill.wordCount));
        setPendingPrefill(null);
    }, [pendingPrefill, selectedCategory]);

    useFocusEffect(
        useCallback(() => {
            let alive = true;

            const run = async () => {
                try {
                    const raw = await AsyncStorage.getItem(PREFILL_KEY);
                    if (!raw) return;

                    const payload = JSON.parse(raw);
                    await AsyncStorage.removeItem(PREFILL_KEY);

                    if (!alive) return;

                    const cat = isValidCategory(payload?.category) ? payload.category : null;
                    const wc = Number.parseInt(String(payload?.wordCount ?? ""), 10);

                    if (cat) setSelectedCategory(cat);

                    if (Number.isFinite(wc) && wc > 0) {
                        setPendingPrefill({
                            category: cat || selectedCategory,
                            wordCount: wc,
                        });
                    }

                    setIsEditing(true);
                } catch (err) {
                    console.error("[LogScreen] Failed to read/parse prefill payload:", err);
                    try {
                        await AsyncStorage.removeItem(PREFILL_KEY);
                    } catch {
                        // ignore
                    }
                }
            };

            run();

            return () => {
                alive = false;
            };
        }, [selectedCategory])
    );

    useEffect(() => {
        const catRaw = route.params?.prefillCategory;
        if (!catRaw) return;

        if (isValidCategory(catRaw)) {
            setSelectedCategory(catRaw);
        }
    }, [route.params?.prefillCategory]);

    const completedCount = useMemo(() => {
        return ["essay", "story", "poem"].reduce((acc, k) => acc + (todayEntries[k] ? 1 : 0), 0);
    }, [todayEntries]);

    const selectedEntry = todayEntries[selectedCategory] || null;

    const isCompleteDay = completedCount === 3;
    const isSelectedCategoryDone = Boolean(selectedEntry);

    const handleSave = async () => {
        const safeTitle = String(title || "").trim();
        if (!safeTitle) {
            Alert.alert("Missing title", "Please enter a title.");
            return;
        }

        setSaving(true);

        try {
            await upsertEntryForDayCategory({
                dayKey,
                category: selectedCategory,
                title: safeTitle,
                author,
                notes,
                tags: parseTagsText(tagsText),
                rating,
                wordCount,
            });

            await loadToday();
            setIsEditing(false);

            Alert.alert("Saved", `${categoryLabel(selectedCategory)} saved for ${dayKey}.`);
        } catch (err) {
            console.error(err);
            Alert.alert("Save failed", "Unable to save this entry.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const existing = todayEntries[selectedCategory];
        if (!existing) {
            Alert.alert("Nothing to delete", "There is no saved entry for this category today.");
            return;
        }

        Alert.alert(
            "Delete entry?",
            `Delete today’s ${categoryLabel(selectedCategory)} entry?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteEntryForDayCategory({ dayKey, category: selectedCategory });
                            await loadToday();
                            setIsEditing(true);
                            Alert.alert("Deleted", "Entry deleted.");
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Delete failed", "Unable to delete this entry.");
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = () => {
        const existing = todayEntries[selectedCategory] || null;
        prefillFromEntry(existing);
        setIsEditing(true);
    };

    const goToNextMissing = () => {
        const order = ["essay", "story", "poem"];
        const missing = order.find((k) => !todayEntries[k]);
        if (missing) setSelectedCategory(missing);
    };

    const pillStyleForCategory = (catKey) => {
        const done = Boolean(todayEntries[catKey]);
        const selected = selectedCategory === catKey;

        const styles = [GlobalStyles.pill];

        if (selected) styles.push(GlobalStyles.pillSelected);
        if (done) styles.push(GlobalStyles.pillSuccess);

        return styles;
    };

    const pillTextColor = (catKey) => {
        const done = Boolean(todayEntries[catKey]);
        if (done) return Colors.text;
        return Colors.text;
    };

    const entryCardStyle = () => {
        if (isSelectedCategoryDone && !isEditing) {
            return GlobalStyles.cardSuccess;
        }
        return GlobalStyles.card;
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Log</Text>
                    <Text style={GlobalStyles.subtitle}>
                        {dayKey} • Daily credit: {completedCount}/3 {isCompleteDay ? "(complete)" : ""}
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Category</Text>

                    <View style={GlobalStyles.dividerRow}>
                        {CATEGORIES.map((c) => (
                            <Pressable
                                key={c.key}
                                onPress={() => setSelectedCategory(c.key)}
                                style={pillStyleForCategory(c.key)}
                            >
                                <Text style={{ fontWeight: "800", color: pillTextColor(c.key) }}>
                                    {c.label}
                                    {todayEntries[c.key] ? " ✓" : ""}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={goToNextMissing} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Jump to next missing</Text>
                    </Pressable>
                </View>

                {loading ? <ActivityIndicator /> : null}

                {error ? (
                    <View style={GlobalStyles.card}>
                        <Text style={GlobalStyles.text}>{error}</Text>
                    </View>
                ) : null}

                <View style={entryCardStyle()}>
                    <Text style={GlobalStyles.label}>
                        {selectedEntry ? "Logged" : "Log"}: {categoryLabel(selectedCategory)}
                    </Text>

                    {selectedEntry && !isEditing ? (
                        <View style={{ gap: 10 }}>
                            <View style={{ gap: 4 }}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                                    {selectedEntry.title}
                                </Text>

                                {selectedEntry.author ? (
                                    <Text style={{ color: Colors.mutedText }}>{selectedEntry.author}</Text>
                                ) : null}

                                <Text style={{ color: Colors.mutedText }}>
                                    Rating: {selectedEntry.rating}
                                    {selectedEntry.wordCount != null ? ` • Words: ${selectedEntry.wordCount}` : ""}
                                </Text>
                            </View>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable onPress={handleEdit} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Edit</Text>
                                </Pressable>

                                <Pressable onPress={handleDelete} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Title *</Text>
                                <TextInput
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g., The Veldt"
                                    placeholderTextColor={Colors.mutedText}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Author</Text>
                                <TextInput
                                    value={author}
                                    onChangeText={setAuthor}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Tags</Text>
                                <Text style={GlobalStyles.muted}>
                                    Comma-separated. Year/type tags are auto-added.
                                </Text>
                                <TextInput
                                    value={tagsText}
                                    onChangeText={setTagsText}
                                    placeholder="e.g., sci-fi, dystopia"
                                    placeholderTextColor={Colors.mutedText}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={GlobalStyles.input}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Rating</Text>
                                <View style={GlobalStyles.dividerRow}>
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const selected = rating === n;
                                        return (
                                            <Pressable
                                                key={n}
                                                onPress={() => setRating(n)}
                                                style={[
                                                    GlobalStyles.pill,
                                                    selected ? GlobalStyles.pillSelected : null,
                                                ]}
                                            >
                                                <Text style={{ fontWeight: "800", color: Colors.text }}>{n}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Estimated word count</Text>
                                <TextInput
                                    value={wordCount}
                                    onChangeText={setWordCount}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    keyboardType="number-pad"
                                    style={[GlobalStyles.input, { maxWidth: 180 }]}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600", color: Colors.text }}>Notes</Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="optional"
                                    placeholderTextColor={Colors.mutedText}
                                    multiline
                                    style={[GlobalStyles.input, { minHeight: 90, textAlignVertical: "top" }]}
                                />
                            </View>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable
                                    onPress={handleSave}
                                    disabled={saving}
                                    style={[
                                        GlobalStyles.button,
                                        { opacity: saving ? 0.6 : 1 },
                                    ]}
                                >
                                    <Text style={GlobalStyles.buttonText}>
                                        {saving ? "Saving..." : "Save"}
                                    </Text>
                                </Pressable>

                                {selectedEntry ? (
                                    <Pressable onPress={() => setIsEditing(false)} style={GlobalStyles.button}>
                                        <Text style={GlobalStyles.buttonText}>Cancel</Text>
                                    </Pressable>
                                ) : null}

                                <Pressable onPress={handleDelete} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default LogScreen;
import React, { useEffect, useMemo, useState } from "react";
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

import {
    getTodayDayKeyNY,
    listEntries,
    upsertEntryForDayCategory,
    deleteEntryForDayCategory,
} from "../lib/store";

const CATEGORIES = [
    { key: "essay", label: "Essay (Nonfiction)" },
    { key: "story", label: "Short Story (Fiction)" },
    { key: "poem", label: "Poem" },
];

const splitTags = (input) => {
    return String(input || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
};

const tagsToString = (tags) => {
    if (!Array.isArray(tags)) return "";
    return tags.join(", ");
};

const emptyForm = () => {
    return {
        title: "",
        author: "",
        tagsText: "",
        rating: 3,
        wordCount: "",
        notes: "",
    };
};

const normalizeWordCount = (value) => {
    const v = String(value || "").trim();
    if (!v) return null;

    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0) return null;

    return n;
};

const RatingRow = ({ value, onChange, disabled }) => {
    return (
        <View style={{ flexDirection: "row", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => {
                const selected = value === n;
                return (
                    <Pressable
                        key={n}
                        onPress={() => onChange(n)}
                        disabled={disabled}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            opacity: disabled ? 0.6 : 1,
                            backgroundColor: selected ? "#ddd" : "transparent",
                        }}
                    >
                        <Text style={{ fontWeight: "600" }}>{n}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const TodayScreen = ({ profile }) => {
    const dayKey = useMemo(() => getTodayDayKeyNY(), []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [itemsByCategory, setItemsByCategory] = useState({
        essay: null,
        story: null,
        poem: null,
    });

    const [formsByCategory, setFormsByCategory] = useState({
        essay: emptyForm(),
        story: emptyForm(),
        poem: emptyForm(),
    });

    const [savingByCategory, setSavingByCategory] = useState({
        essay: false,
        story: false,
        poem: false,
    });

    const [saveErrorByCategory, setSaveErrorByCategory] = useState({
        essay: "",
        story: "",
        poem: "",
    });

    const completedCount = useMemo(() => {
        return CATEGORIES.reduce(
            (acc, c) => acc + (itemsByCategory[c.key] ? 1 : 0),
            0
        );
    }, [itemsByCategory]);

    const loadToday = async () => {
        setLoading(true);
        setError("");

        try {
            const items = await listEntries({
                dayKey,
                profileId: profile?.id,
            });

            const nextItemsByCategory = { essay: null, story: null, poem: null };
            for (const item of items) {
                if (nextItemsByCategory[item.category] == null) {
                    nextItemsByCategory[item.category] = item;
                }
            }

            const nextForms = {
                essay: emptyForm(),
                story: emptyForm(),
                poem: emptyForm(),
            };

            for (const c of CATEGORIES) {
                const existing = nextItemsByCategory[c.key];
                if (existing) {
                    nextForms[c.key] = {
                        title: existing.title || "",
                        author: existing.author || "",
                        tagsText: tagsToString(existing.tags),
                        rating: Number(existing.rating ?? 3),
                        wordCount:
                            existing.wordCount == null ? "" : String(existing.wordCount),
                        notes: existing.notes || "",
                    };
                }
            }

            setItemsByCategory(nextItemsByCategory);
            setFormsByCategory(nextForms);
        } catch (err) {
            console.error(err);
            setError("Failed to load today's entries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadToday();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayKey, profile?.id]);

    const updateForm = (category, patch) => {
        setFormsByCategory((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                ...patch,
            },
        }));
    };

    const setSaving = (category, isSaving) => {
        setSavingByCategory((prev) => ({ ...prev, [category]: isSaving }));
    };

    const setSaveError = (category, message) => {
        setSaveErrorByCategory((prev) => ({ ...prev, [category]: message }));
    };

    const handleSave = async (category) => {
        setSaveError(category, "");

        const form = formsByCategory[category];

        if (!form.title.trim()) {
            setSaveError(category, "Title is required.");
            return;
        }

        if (!Number.isFinite(Number(form.rating)) || form.rating < 1 || form.rating > 5) {
            setSaveError(category, "Rating must be between 1 and 5.");
            return;
        }

        const wordCountNum = normalizeWordCount(form.wordCount);

        const payload = {
            profileId: profile?.id,
            dayKey,
            category,
            title: form.title.trim(),
            author: String(form.author || "").trim(),
            notes: String(form.notes || ""),
            tags: splitTags(form.tagsText),
            rating: Number(form.rating),
            wordCount: wordCountNum === null ? null : wordCountNum,
        };

        setSaving(category, true);

        try {
            const saved = await upsertEntryForDayCategory(payload);

            setItemsByCategory((prev) => ({ ...prev, [category]: saved }));

            Alert.alert("Saved", `${category.toUpperCase()} entry saved.`);
        } catch (err) {
            console.error(err);
            setSaveError(category, "Save failed. Please try again.");
        } finally {
            setSaving(category, false);
        }
    };

    const handleDelete = async (category) => {
        const existing = itemsByCategory[category];
        if (!existing) return;

        Alert.alert(
            "Delete entry?",
            "This will remove the entry for today in this category.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setSaveError(category, "");
                        setSaving(category, true);

                        try {
                            await deleteEntryForDayCategory({
                                profileId: profile?.id,
                                dayKey,
                                category,
                            });

                            setItemsByCategory((prev) => ({
                                ...prev,
                                [category]: null,
                            }));

                            setFormsByCategory((prev) => ({
                                ...prev,
                                [category]: emptyForm(),
                            }));
                        } catch (err) {
                            console.error(err);
                            setSaveError(category, "Delete failed. Please try again.");
                        } finally {
                            setSaving(category, false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Today</Text>
                    <Text style={{ opacity: 0.7 }}>
                        {profile?.displayName} — {dayKey}
                    </Text>
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
                    <Text style={{ fontSize: 18, fontWeight: "600" }}>
                        Completed: {completedCount}/3
                    </Text>

                    <Pressable
                        onPress={loadToday}
                        style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text style={{ fontWeight: "600" }}>
                            {loading ? "Loading…" : "Refresh"}
                        </Text>
                    </Pressable>
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

                {CATEGORIES.map((c) => {
                    const existing = itemsByCategory[c.key];
                    const form = formsByCategory[c.key];
                    const saving = savingByCategory[c.key];
                    const saveErr = saveErrorByCategory[c.key];

                    return (
                        <View
                            key={c.key}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 10,
                            }}
                        >
                            <View style={{ gap: 2 }}>
                                <Text style={{ fontSize: 16, fontWeight: "700" }}>
                                    {c.label}
                                </Text>
                                <Text style={{ opacity: 0.7 }}>
                                    {existing ? "Saved" : "Not logged yet"}
                                </Text>
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>Title</Text>
                                <TextInput
                                    value={form.title}
                                    onChangeText={(v) => updateForm(c.key, { title: v })}
                                    editable={!saving}
                                    placeholder="Title"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>Author (optional)</Text>
                                <TextInput
                                    value={form.author}
                                    onChangeText={(v) => updateForm(c.key, { author: v })}
                                    editable={!saving}
                                    placeholder="Author"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>
                                    Tags (comma-separated)
                                </Text>
                                <TextInput
                                    value={form.tagsText}
                                    onChangeText={(v) => updateForm(c.key, { tagsText: v })}
                                    editable={!saving}
                                    placeholder="genre, topic, theme"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>Rating</Text>
                                <RatingRow
                                    value={form.rating}
                                    onChange={(n) => updateForm(c.key, { rating: n })}
                                    disabled={saving}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>
                                    Estimated word count (optional)
                                </Text>
                                <TextInput
                                    value={form.wordCount}
                                    onChangeText={(v) => updateForm(c.key, { wordCount: v })}
                                    editable={!saving}
                                    placeholder="e.g., 2500"
                                    keyboardType="number-pad"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                />
                            </View>

                            <View style={{ gap: 6 }}>
                                <Text style={{ fontWeight: "600" }}>Notes</Text>
                                <TextInput
                                    value={form.notes}
                                    onChangeText={(v) => updateForm(c.key, { notes: v })}
                                    editable={!saving}
                                    placeholder="Thoughts, quotes, takeaways…"
                                    multiline
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        padding: 10,
                                        minHeight: 90,
                                        textAlignVertical: "top",
                                    }}
                                />
                            </View>

                            {saveErr ? (
                                <View
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 10,
                                        padding: 10,
                                    }}
                                >
                                    <Text>{saveErr}</Text>
                                </View>
                            ) : null}

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <Pressable
                                    onPress={() => handleSave(c.key)}
                                    disabled={saving}
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                        opacity: saving ? 0.6 : 1,
                                    }}
                                >
                                    <Text style={{ fontWeight: "600" }}>
                                        {saving ? "Saving…" : existing ? "Update" : "Save"}
                                    </Text>
                                </Pressable>

                                {existing ? (
                                    <Pressable
                                        onPress={() => handleDelete(c.key)}
                                        disabled={saving}
                                        style={{
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: "#999",
                                            borderRadius: 8,
                                            opacity: saving ? 0.6 : 1,
                                        }}
                                    >
                                        <Text style={{ fontWeight: "600" }}>Delete</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

export default TodayScreen;
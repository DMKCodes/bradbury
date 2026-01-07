import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { normalizeTagsInput } from "../../lib/tagUtils";

const CATEGORIES = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const LogReadingForm = ({
    visible,
    activeDayKey,
    initial,
    onSave,
    onClose,
    GlobalStyles,
    Colors,
}) => {
    const OK = Colors.ok ?? "#2ECC71";
    const OK_BG = Colors.okBg ?? "rgba(46, 204, 113, 0.12)";
    const MUTED = Colors.mutedText ?? "#A0A0A0";

    const initialMemo = useMemo(() => {
        return {
            editingCategory: initial?.editingCategory ?? null,
            category: initial?.category ?? "essay",
            title: initial?.title ?? "",
            author: initial?.author ?? "",
            url: initial?.url ?? "",
            rating: initial?.rating ?? 5,
            wordCount: initial?.wordCount ?? "",
            tagsRaw: initial?.tagsRaw ?? "",
            notes: initial?.notes ?? "",
        };
    }, [initial]);

    const [editingCategory, setEditingCategory] = useState(initialMemo.editingCategory);
    const [category, setCategory] = useState(initialMemo.category);
    const [title, setTitle] = useState(initialMemo.title);
    const [author, setAuthor] = useState(initialMemo.author);
    const [url, setUrl] = useState(initialMemo.url);
    const [rating, setRating] = useState(initialMemo.rating);
    const [wordCount, setWordCount] = useState(initialMemo.wordCount);
    const [tagsRaw, setTagsRaw] = useState(initialMemo.tagsRaw);
    const [notes, setNotes] = useState(initialMemo.notes);

    useEffect(() => {
        if (!visible) return;

        setEditingCategory(initialMemo.editingCategory);
        setCategory(initialMemo.category);
        setTitle(initialMemo.title);
        setAuthor(initialMemo.author);
        setUrl(initialMemo.url);
        setRating(initialMemo.rating);
        setWordCount(initialMemo.wordCount);
        setTagsRaw(initialMemo.tagsRaw);
        setNotes(initialMemo.notes);
    }, [visible, initialMemo]);

    if (!visible) return null;

    const submit = async () => {
        try {
            const trimmedTitle = String(title || "").trim();
            if (!trimmedTitle) {
                Alert.alert("Missing title", "Please enter a title.");
                return;
            }

            const tags = normalizeTagsInput(tagsRaw);

            const payload = {
                dayKey: activeDayKey,
                category,
                title: trimmedTitle,
                author,
                url,
                rating,
                wordCount,
                tags,
                notes,
                editingCategory,
            };

            const result = await Promise.race([
                onSave(payload),
                new Promise((_, reject) => setTimeout(() => reject(new Error("save_timeout_5000ms")), 5000)),
            ]);

            if (result !== false) {
                onClose?.();
            }
        } catch (err) {
            console.error("[LogReadingForm] Submit failed:", err);
            Alert.alert("Save failed", String(err?.message || err));
        }
    };

    return (
        <View style={GlobalStyles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={GlobalStyles.title}>
                    {editingCategory ? "Edit Reading" : "Log a Reading"}
                </Text>

                <Pressable onPress={onClose} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontWeight: "900", color: MUTED }}>Close</Text>
                </Pressable>
            </View>

            <Text style={GlobalStyles.muted}>
                Logging for: <Text style={{ fontWeight: "900", color: Colors.text }}>{activeDayKey}</Text>
            </Text>

            <View style={{ height: 12 }} />

            <Text style={GlobalStyles.label}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {CATEGORIES.map((c) => {
                    const selected = c.key === category;

                    return (
                        <Pressable
                            key={c.key}
                            onPress={() => setCategory(c.key)}
                            style={[
                                GlobalStyles.pill,
                                selected
                                    ? { borderColor: OK, backgroundColor: OK_BG }
                                    : { borderColor: Colors.border },
                            ]}
                        >
                            <Text style={{ fontWeight: "900", color: Colors.text }}>
                                {c.label}
                                {selected ? " ✓" : ""}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={{ height: 12 }} />

            <Text style={GlobalStyles.label}>Title</Text>
            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., The Lottery"
                placeholderTextColor={MUTED}
                style={GlobalStyles.input}
            />

            <Text style={GlobalStyles.label}>Author</Text>
            <TextInput
                value={author}
                onChangeText={setAuthor}
                placeholder="Optional"
                placeholderTextColor={MUTED}
                style={GlobalStyles.input}
            />

            <Text style={GlobalStyles.label}>URL</Text>
            <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="Optional"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                style={GlobalStyles.input}
            />

            <View style={{ height: 12 }} />

            <Text style={GlobalStyles.label}>Rating</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => {
                    const filled = n <= rating;
                    return (
                        <Pressable key={n} onPress={() => setRating(n)}>
                            <FontAwesome
                                name={filled ? "star" : "star-o"}
                                size={22}
                                color={filled ? OK : MUTED}
                            />
                        </Pressable>
                    );
                })}
            </View>

            <View style={{ height: 12 }} />

            <Text style={GlobalStyles.label}>Estimated word count</Text>
            <TextInput
                value={wordCount}
                onChangeText={setWordCount}
                placeholder="Optional"
                placeholderTextColor={MUTED}
                keyboardType="number-pad"
                style={GlobalStyles.input}
            />

            <Text style={GlobalStyles.label}>Tags</Text>
            <TextInput
                value={tagsRaw}
                onChangeText={setTagsRaw}
                placeholder="Comma-separated, e.g. folklore, year:2026"
                placeholderTextColor={MUTED}
                style={GlobalStyles.input}
            />

            <Text style={GlobalStyles.label}>Notes</Text>
            <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional"
                placeholderTextColor={MUTED}
                style={[GlobalStyles.input, { height: 120, textAlignVertical: "top" }]}
                multiline
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable onPress={submit} style={[GlobalStyles.button, { borderColor: OK }]}>
                    <Text style={GlobalStyles.buttonText}>Save</Text>
                </Pressable>

                <Pressable onPress={onClose} style={[GlobalStyles.button, { borderColor: Colors.border }]}>
                    <Text style={GlobalStyles.buttonText}>Cancel</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default LogReadingForm;
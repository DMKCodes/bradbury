import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addBook, deleteBook, listBookYears, listBooks, updateBook } from "../lib/booksStore";
import { Colors, GlobalStyles } from "../theme/theme";

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

const getTodayISODate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const BooksScreen = () => {
    const [loading, setLoading] = useState(true);

    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("All");

    const [books, setBooks] = useState([]);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [rating, setRating] = useState(5);
    const [wordCount, setWordCount] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");

    const [editingId, setEditingId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const ys = await listBookYears();
            setYears(ys);

            const yearFilter = selectedYear === "All" ? undefined : selectedYear;
            const bs = await listBooks({ year: yearFilter });
            setBooks(bs);
        } catch (err) {
            console.error(err);
            setYears([]);
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    const visibleYears = useMemo(() => {
        const currentYear = String(new Date().getFullYear());
        const all = new Set([currentYear, ...(years || [])]);
        return [...all].sort((a, b) => (a < b ? 1 : -1));
    }, [years]);

    const resetForm = () => {
        setTitle("");
        setAuthor("");
        setRating(5);
        setWordCount("");
        setTagsText("");
        setNotes("");
        setEditingId(null);
    };

    const startEdit = (b) => {
        setEditingId(b.id);
        setTitle(b.title || "");
        setAuthor(b.author || "");
        setRating(Number(b.rating || 5));
        setWordCount(b.wordCount == null ? "" : String(b.wordCount));
        setTagsText(tagsToText(b.tags));
        setNotes(b.notes || "");
    };

    const handleSave = async () => {
        const safeTitle = String(title || "").trim();
        if (!safeTitle) {
            Alert.alert("Missing title", "Please enter a book title.");
            return;
        }

        const payload = {
            title: safeTitle,
            author: String(author || "").trim(),
            rating,
            wordCount,
            tags: parseTagsText(tagsText),
            notes: String(notes || "").trim(),
        };

        if (editingId) {
            const res = await updateBook(editingId, payload);
            if (!res.ok) {
                Alert.alert("Error", "Unable to update this book.");
                return;
            }
        } else {
            const res = await addBook({
                ...payload,
                finishedDate: getTodayISODate(),
            });
            if (!res.ok) {
                Alert.alert("Error", "Unable to add this book.");
                return;
            }
        }

        resetForm();
        load();
    };

    const handleDelete = async (b) => {
        Alert.alert(
            "Delete book?",
            `Delete "${b.title}" from your books list?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteBook(b.id);
                        if (editingId === b.id) resetForm();
                        load();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Books</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Completed books (separate from Bradbury challenge).
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

                        {visibleYears.map((y) => (
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

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>
                        {editingId ? "Edit book" : "Add book"}
                    </Text>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600", color: Colors.text }}>Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., The Left Hand of Darkness"
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
                        <Text style={{ fontWeight: "600", color: Colors.text }}>Tags</Text>
                        <Text style={GlobalStyles.muted}>
                            Comma-separated. Year/type tags are auto-added.
                        </Text>
                        <TextInput
                            value={tagsText}
                            onChangeText={setTagsText}
                            placeholder="e.g., sci-fi, sociology"
                            placeholderTextColor={Colors.mutedText}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={GlobalStyles.input}
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
                        <Pressable onPress={handleSave} style={GlobalStyles.button}>
                            <Text style={GlobalStyles.buttonText}>
                                {editingId ? "Save Changes" : "Add Book"}
                            </Text>
                        </Pressable>

                        {editingId ? (
                            <Pressable onPress={resetForm} style={GlobalStyles.button}>
                                <Text style={GlobalStyles.buttonText}>Cancel</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>
                        Books {loading ? "(loading...)" : `(${books.length})`}
                    </Text>

                    {books.length === 0 ? (
                        <Text style={GlobalStyles.muted}>
                            No books yet for this filter.
                        </Text>
                    ) : null}

                    {books.map((b) => (
                        <View
                            key={b.id}
                            style={{
                                borderTopWidth: 1,
                                borderTopColor: Colors.border,
                                paddingTop: 10,
                                gap: 6,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                                {b.title}
                            </Text>

                            {b.author ? (
                                <Text style={GlobalStyles.muted}>{b.author}</Text>
                            ) : null}

                            <Text style={GlobalStyles.muted}>
                                {b.finishedDate ? `${b.finishedDate}` : ""}
                                {b.year ? ` • ${b.year}` : ""}
                                {b.rating != null ? ` • Rating: ${b.rating}` : ""}
                                {b.wordCount != null ? ` • Words: ${b.wordCount}` : ""}
                            </Text>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable onPress={() => startEdit(b)} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Edit</Text>
                                </Pressable>

                                <Pressable onPress={() => handleDelete(b)} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BooksScreen;
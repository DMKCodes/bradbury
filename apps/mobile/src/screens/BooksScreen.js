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

const parseTagsText = (text) => {
    return String(text || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
};

const tagsToText = (tags) => {
    if (!Array.isArray(tags)) return "";
    return tags.join(", ");
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

    // Create form
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [rating, setRating] = useState(5);
    const [wordCount, setWordCount] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");

    // Edit state
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
            author,
            rating,
            wordCount,
            tags: parseTagsText(tagsText),
            notes,
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

    const handleCancelEdit = () => {
        resetForm();
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
                        if (editingId === b.id) {
                            resetForm();
                        }
                        load();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Books</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Track books completed (separate from daily Bradbury credit).
                    </Text>
                </View>

                {/* Year filter */}
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#999",
                        borderRadius: 10,
                        padding: 12,
                        gap: 10,
                    }}
                >
                    <Text style={{ fontWeight: "800" }}>Year</Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {["All", ...visibleYears].map((y) => {
                            const selected = selectedYear === y;
                            return (
                                <Pressable
                                    key={y}
                                    onPress={() => setSelectedYear(y)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 999,
                                        backgroundColor: selected ? "#ddd" : "transparent",
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>{y}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
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
                    <Text style={{ fontWeight: "800" }}>
                        {editingId ? "Edit book" : "Add book"}
                    </Text>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., The Left Hand of Darkness"
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                            }}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Author</Text>
                        <TextInput
                            value={author}
                            onChangeText={setAuthor}
                            placeholder="optional"
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
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {[1, 2, 3, 4, 5].map((n) => {
                                const selected = rating === n;
                                return (
                                    <Pressable
                                        key={n}
                                        onPress={() => setRating(n)}
                                        style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: "#999",
                                            borderRadius: 999,
                                            backgroundColor: selected ? "#ddd" : "transparent",
                                        }}
                                    >
                                        <Text style={{ fontWeight: "800" }}>{n}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Estimated word count</Text>
                        <TextInput
                            value={wordCount}
                            onChangeText={setWordCount}
                            placeholder="optional"
                            keyboardType="number-pad"
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                                maxWidth: 180,
                            }}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Tags</Text>
                        <TextInput
                            value={tagsText}
                            onChangeText={setTagsText}
                            placeholder="comma-separated (optional)"
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
                        <Text style={{ fontWeight: "600" }}>Notes</Text>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="optional"
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

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        <Pressable
                            onPress={handleSave}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "800" }}>
                                {editingId ? "Save Changes" : "Add Book"}
                            </Text>
                        </Pressable>

                        {editingId ? (
                            <Pressable
                                onPress={handleCancelEdit}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderWidth: 1,
                                    borderColor: "#999",
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ fontWeight: "800" }}>Cancel</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>

                {/* List */}
                <View style={{ gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>
                        Books {loading ? "(loading...)" : `(${books.length})`}
                    </Text>

                    {books.map((b) => (
                        <View
                            key={b.id}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "800" }}>
                                {b.title}
                            </Text>

                            {b.author ? (
                                <Text style={{ opacity: 0.8 }}>{b.author}</Text>
                            ) : null}

                            <Text style={{ opacity: 0.7 }}>
                                {b.finishedDate ? `${b.finishedDate}` : ""}
                                {b.year ? ` • ${b.year}` : ""}
                                {b.rating != null ? ` • Rating: ${b.rating}` : ""}
                                {b.wordCount != null ? ` • Words: ${b.wordCount}` : ""}
                            </Text>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable
                                    onPress={() => startEdit(b)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 10,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>Edit</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => handleDelete(b)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 10,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}

                    {!loading && books.length === 0 ? (
                        <Text style={{ opacity: 0.7 }}>
                            No books yet for this filter.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BooksScreen;
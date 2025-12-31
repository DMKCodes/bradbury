import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    addTopicItem,
    deleteTopicItem,
    getTopicById,
    toggleTopicItemFinished,
} from "../lib/curriculumStore";
import { Colors, GlobalStyles } from "../theme/theme";

const TYPE_OPTIONS = [
    { key: "book", label: "Book" },
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const CurriculumTopicScreen = ({ route }) => {
    const topicId = route.params?.topicId;

    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState(null);

    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState("book");

    const load = async () => {
        setLoading(true);
        try {
            const t = await getTopicById(topicId);
            setTopic(t);
        } catch (err) {
            console.error(err);
            setTopic(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId]);

    const header = useMemo(() => {
        if (loading) return "Topic";
        if (!topic) return "Topic (not found)";
        return topic.name;
    }, [loading, topic]);

    const handleAdd = async () => {
        const safeTitle = String(title || "").trim();
        if (!safeTitle) {
            Alert.alert("Missing title", "Enter a title for the reading list item.");
            return;
        }

        const res = await addTopicItem({
            topicId,
            title: safeTitle,
            url,
            type,
        });

        if (!res.ok) {
            Alert.alert("Error", "Unable to add item.");
            return;
        }

        setTitle("");
        setUrl("");
        setType("book");
        load();
    };

    const handleToggle = async (item) => {
        await toggleTopicItemFinished({ topicId, itemId: item.id });
        load();
    };

    const handleDelete = async (item) => {
        Alert.alert(
            "Delete item?",
            `Delete "${item.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTopicItem({ topicId, itemId: item.id });
                        load();
                    },
                },
            ]
        );
    };

    const openUrl = async (u) => {
        const safe = String(u || "").trim();
        if (!safe) return;

        try {
            const supported = await Linking.canOpenURL(safe);
            if (!supported) {
                Alert.alert("Can't open link", "This URL could not be opened.");
                return;
            }
            await Linking.openURL(safe);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Unable to open this URL.");
        }
    };

    const items = Array.isArray(topic?.items) ? topic.items : [];

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>{header}</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Add items and mark them finished.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Add item</Text>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600", color: Colors.text }}>Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., The Design of Everyday Things"
                            placeholderTextColor={Colors.mutedText}
                            style={GlobalStyles.input}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600", color: Colors.text }}>URL (optional)</Text>
                        <TextInput
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://..."
                            placeholderTextColor={Colors.mutedText}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={GlobalStyles.input}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600", color: Colors.text }}>Type</Text>
                        <View style={GlobalStyles.dividerRow}>
                            {TYPE_OPTIONS.map((t) => {
                                const selected = type === t.key;
                                return (
                                    <Pressable
                                        key={t.key}
                                        onPress={() => setType(t.key)}
                                        style={[
                                            GlobalStyles.pill,
                                            selected ? GlobalStyles.pillSelected : null,
                                        ]}
                                    >
                                        <Text style={{ fontWeight: "800", color: Colors.text }}>
                                            {t.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <Pressable onPress={handleAdd} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Add Item</Text>
                    </Pressable>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>
                        Items {loading ? "(loading...)" : `(${items.length})`}
                    </Text>

                    {items.length === 0 && !loading ? (
                        <Text style={GlobalStyles.muted}>
                            No items yet. Add your first reading list item above.
                        </Text>
                    ) : null}

                    {items.map((item) => {
                        const finished = Boolean(item.finished);

                        return (
                            <View
                                key={item.id}
                                style={{
                                    borderTopWidth: 1,
                                    borderTopColor: Colors.border,
                                    paddingTop: 10,
                                    gap: 6,
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                                    {finished ? "✓ " : ""}{item.title}
                                </Text>

                                <Text style={GlobalStyles.muted}>
                                    Type: {TYPE_OPTIONS.find((x) => x.key === item.type)?.label || item.type}
                                </Text>

                                {item.url ? (
                                    <Pressable onPress={() => openUrl(item.url)}>
                                        <Text style={{ color: Colors.accent2 }}>
                                            {item.url}
                                        </Text>
                                    </Pressable>
                                ) : null}

                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                    <Pressable onPress={() => handleToggle(item)} style={GlobalStyles.button}>
                                        <Text style={GlobalStyles.buttonText}>
                                            {finished ? "Mark Unfinished" : "Mark Finished"}
                                        </Text>
                                    </Pressable>

                                    <Pressable onPress={() => handleDelete(item)} style={GlobalStyles.button}>
                                        <Text style={GlobalStyles.buttonText}>Delete</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CurriculumTopicScreen;
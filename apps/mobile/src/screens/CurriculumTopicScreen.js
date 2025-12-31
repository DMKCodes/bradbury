import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

import {
    addTopicItem,
    deleteTopicItem,
    getTopicById,
    toggleTopicItemFinished,
} from "../lib/curriculumStore";

const TYPE_OPTIONS = [
    { key: "book", label: "Book" },
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const CurriculumTopicScreen = () => {
    const route = useRoute();
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
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>{header}</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Add reading list items and mark them finished.
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
                    <Text style={{ fontWeight: "800" }}>Add item</Text>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., The Design of Everyday Things"
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                padding: 10,
                            }}
                        />
                    </View>

                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "600" }}>URL (optional)</Text>
                        <TextInput
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://..."
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
                        <Text style={{ fontWeight: "600" }}>Type</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {TYPE_OPTIONS.map((t) => {
                                const selected = type === t.key;
                                return (
                                    <Pressable
                                        key={t.key}
                                        onPress={() => setType(t.key)}
                                        style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: "#999",
                                            borderRadius: 999,
                                            backgroundColor: selected ? "#ddd" : "transparent",
                                        }}
                                    >
                                        <Text style={{ fontWeight: "800" }}>{t.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <Pressable
                        onPress={handleAdd}
                        style={{
                            alignSelf: "flex-start",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ fontWeight: "800" }}>Add Item</Text>
                    </Pressable>
                </View>

                <View style={{ gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>
                        Items {loading ? "(loading...)" : `(${items.length})`}
                    </Text>

                    {items.map((item) => (
                        <View
                            key={item.id}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "800" }}>
                                {item.finished ? "✓ " : ""}{item.title}
                            </Text>

                            <Text style={{ opacity: 0.7 }}>
                                Type: {TYPE_OPTIONS.find((x) => x.key === item.type)?.label || item.type}
                            </Text>

                            {item.url ? (
                                <Pressable onPress={() => openUrl(item.url)}>
                                    <Text style={{ color: "#1a0dab" }}>{item.url}</Text>
                                </Pressable>
                            ) : null}

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable
                                    onPress={() => handleToggle(item)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 10,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>
                                        {item.finished ? "Mark Unfinished" : "Mark Finished"}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => handleDelete(item)}
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

                    {!loading && items.length === 0 ? (
                        <Text style={{ opacity: 0.7 }}>
                            No items yet. Add your first reading list item above.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CurriculumTopicScreen;
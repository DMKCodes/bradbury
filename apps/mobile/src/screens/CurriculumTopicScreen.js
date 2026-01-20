import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    addTopicItem,
    deleteTopicItem,
    getTopicById,
    toggleTopicItemFinished,
} from "../lib/curriculumStore";
import { Colors, GlobalStyles } from "../theme/theme";

import AddReadingListItem from "../components/curriculum/AddReadingListItem";
import ReadingListItemCard from "../components/curriculum/ReadingListItemCard";

const CurriculumTopicScreen = ({ route }) => {
    const topicId = route.params?.topicId;

    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState(null);

    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState("essay");

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
        setType("essay");
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

                <AddReadingListItem
                    title={title}
                    setTitle={setTitle}
                    url={url}
                    setUrl={setUrl}
                    type={type}
                    setType={setType}
                    onAdd={handleAdd}
                    GlobalStyles={GlobalStyles}
                    Colors={Colors}
                />

                <ReadingListItemCard
                    items={items}
                    loading={loading}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    GlobalStyles={GlobalStyles}
                    Colors={Colors}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default CurriculumTopicScreen;
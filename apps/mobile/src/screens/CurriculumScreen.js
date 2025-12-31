import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { addTopic, deleteTopic, listTopics } from "../lib/curriculumStore";

const CurriculumScreen = () => {
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [topics, setTopics] = useState([]);

    const [newTopic, setNewTopic] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const t = await listTopics();
            setTopics(t);
        } catch (err) {
            console.error(err);
            setTopics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleAdd = async () => {
        const name = String(newTopic || "").trim();
        if (!name) {
            Alert.alert("Missing topic", "Enter a topic name.");
            return;
        }

        const res = await addTopic(name);
        if (!res.ok) {
            Alert.alert("Error", "Unable to add topic.");
            return;
        }

        setNewTopic("");
        load();
    };

    const handleDelete = async (topic) => {
        Alert.alert(
            "Delete topic?",
            `Delete "${topic.name}" and all items under it?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTopic(topic.id);
                        load();
                    },
                },
            ]
        );
    };

    const openTopic = (topic) => {
        navigation.navigate("CurriculumTopic", { topicId: topic.id });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Curriculum</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Track topics and maintain per-topic reading lists.
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
                    <Text style={{ fontWeight: "800" }}>Add a topic</Text>

                    <TextInput
                        value={newTopic}
                        onChangeText={setNewTopic}
                        placeholder="e.g., Engineering"
                        style={{
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            padding: 10,
                        }}
                    />

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
                        <Text style={{ fontWeight: "800" }}>Add Topic</Text>
                    </Pressable>
                </View>

                <View style={{ gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>
                        Topics {loading ? "(loading...)" : `(${topics.length})`}
                    </Text>

                    {topics.map((t) => (
                        <View
                            key={t.id}
                            style={{
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Pressable onPress={() => openTopic(t)}>
                                <Text style={{ fontSize: 16, fontWeight: "800" }}>
                                    {t.name}
                                </Text>
                                <Text style={{ opacity: 0.7 }}>
                                    {(t.items || []).length} item(s)
                                </Text>
                            </Pressable>

                            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                                <Pressable
                                    onPress={() => openTopic(t)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 10,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>Open</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => handleDelete(t)}
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

                    {!loading && topics.length === 0 ? (
                        <Text style={{ opacity: 0.7 }}>
                            No topics yet. Add your first topic above.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CurriculumScreen;
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addTopic, deleteTopic, listTopics } from "../lib/curriculumStore";
import { Colors, GlobalStyles } from "../theme/theme";

const CurriculumScreen = ({ navigation }) => {
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
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Curriculum</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Maintain topics and reading lists (to-do style).
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Add a topic</Text>

                    <TextInput
                        value={newTopic}
                        onChangeText={setNewTopic}
                        placeholder="e.g., Engineering"
                        placeholderTextColor={Colors.mutedText}
                        style={GlobalStyles.input}
                    />

                    <Pressable onPress={handleAdd} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Add Topic</Text>
                    </Pressable>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>
                        Topics {loading ? "(loading...)" : `(${topics.length})`}
                    </Text>

                    {topics.length === 0 && !loading ? (
                        <Text style={GlobalStyles.muted}>
                            No topics yet. Add your first topic above.
                        </Text>
                    ) : null}

                    {topics.map((t) => (
                        <View
                            key={t.id}
                            style={{
                                borderTopWidth: 1,
                                borderTopColor: Colors.border,
                                paddingTop: 10,
                                gap: 8,
                            }}
                        >
                            <Pressable onPress={() => openTopic(t)}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                                    {t.name}
                                </Text>
                                <Text style={GlobalStyles.muted}>
                                    {(t.items || []).length} item(s)
                                </Text>
                            </Pressable>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                <Pressable onPress={() => openTopic(t)} style={GlobalStyles.button}>
                                    <Text style={GlobalStyles.buttonText}>Open</Text>
                                </Pressable>

                                <Pressable onPress={() => handleDelete(t)} style={GlobalStyles.button}>
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

export default CurriculumScreen;
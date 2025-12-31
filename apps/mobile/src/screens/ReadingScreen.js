import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFILL_KEY = "bradbury_log_prefill_v1";

const countWords = (text) => {
    const cleaned = String(text || "").trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).filter(Boolean).length;
};

const CATEGORY_CHOICES = [
    { key: "essay", label: "Log Essay" },
    { key: "story", label: "Log Short Story" },
    { key: "poem", label: "Log Poem" },
];

const LOG_SCREEN_ROUTE_NAME = "Log";

const ReadingScreen = () => {
    const navigation = useNavigation();

    const [text, setText] = useState("");
    const [showPicker, setShowPicker] = useState(false);

    const wordCount = useMemo(() => countWords(text), [text]);

    const openPicker = () => {
        if (wordCount <= 0) return;
        setShowPicker(true);
    };

    const handlePick = async (categoryKey) => {
        const wc = wordCount;

        // Write payload to AsyncStorage.
        const payload = {
            category: categoryKey,
            wordCount: wc,
            createdAt: Date.now(),
        };

        try {
            await AsyncStorage.setItem(PREFILL_KEY, JSON.stringify(payload));
        } catch (err) {
            console.error("[ReadingScreen] Failed to write prefill payload:", err);
        }

        // Discard pasted text.
        setText("");
        setShowPicker(false);

        // Navigate to Log.
        navigation.navigate(LOG_SCREEN_ROUTE_NAME, {
            prefillCategory: categoryKey,
        });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Reading</Text>
                    <Text style={{ opacity: 0.7 }}>
                        Paste text to calculate word count. Nothing here is saved.
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
                    <Text style={{ fontWeight: "700" }}>Paste text</Text>

                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder="Paste article/story/essay/poem text here (temporary)…"
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            padding: 10,
                            minHeight: 220,
                            textAlignVertical: "top",
                        }}
                    />

                    <View style={{ gap: 2 }}>
                        <Text style={{ fontWeight: "700" }}>
                            Word count: {wordCount.toLocaleString()}
                        </Text>
                        {wordCount <= 0 ? (
                            <Text style={{ opacity: 0.7 }}>
                                Paste some text to enable logging.
                            </Text>
                        ) : (
                            <Text style={{ opacity: 0.7 }}>
                                Tap “Finished?” to select what you’re logging.
                            </Text>
                        )}
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        <Pressable
                            onPress={openPicker}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                                opacity: wordCount > 0 ? 1 : 0.5,
                            }}
                            disabled={wordCount <= 0}
                        >
                            <Text style={{ fontWeight: "800" }}>Finished?</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setText("")}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "800" }}>Clear</Text>
                        </Pressable>
                    </View>
                </View>

                {showPicker ? (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.35)",
                            padding: 16,
                            justifyContent: "center",
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                padding: 16,
                                gap: 12,
                            }}
                        >
                            <Text style={{ fontSize: 18, fontWeight: "800" }}>
                                Log this reading
                            </Text>
                            <Text style={{ opacity: 0.7 }}>
                                Word count: {wordCount.toLocaleString()}
                            </Text>

                            {CATEGORY_CHOICES.map((c) => (
                                <Pressable
                                    key={c.key}
                                    onPress={() => handlePick(c.key)}
                                    style={{
                                        paddingVertical: 12,
                                        paddingHorizontal: 12,
                                        borderWidth: 1,
                                        borderColor: "#999",
                                        borderRadius: 10,
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>{c.label}</Text>
                                </Pressable>
                            ))}

                            <Pressable
                                onPress={() => setShowPicker(false)}
                                style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 12,
                                    borderWidth: 1,
                                    borderColor: "#999",
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ fontWeight: "800" }}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ReadingScreen;
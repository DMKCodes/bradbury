import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Colors, GlobalStyles } from "../theme/theme";

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

        setText("");
        setShowPicker(false);

        navigation.navigate(LOG_SCREEN_ROUTE_NAME, {
            prefillCategory: categoryKey,
        });
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Reading</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Paste text to calculate word count. Nothing here is saved.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Paste text</Text>

                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder="Paste article/story/essay/poem text here (temporary)…"
                        placeholderTextColor={Colors.mutedText}
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[GlobalStyles.input, { minHeight: 220, textAlignVertical: "top" }]}
                    />

                    <View style={{ gap: 2 }}>
                        <Text style={GlobalStyles.text}>
                            <Text style={{ fontWeight: "800" }}>Word count:</Text>{" "}
                            {wordCount.toLocaleString()}
                        </Text>
                        <Text style={GlobalStyles.muted}>
                            Tap “Finished?” to select what you’re logging.
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        <Pressable
                            onPress={openPicker}
                            style={[
                                GlobalStyles.button,
                                { opacity: wordCount > 0 ? 1 : 0.5 },
                            ]}
                            disabled={wordCount <= 0}
                        >
                            <Text style={GlobalStyles.buttonText}>Finished?</Text>
                        </Pressable>

                        <Pressable onPress={() => setText("")} style={GlobalStyles.button}>
                            <Text style={GlobalStyles.buttonText}>Clear</Text>
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
                            backgroundColor: Colors.overlay,
                            padding: 16,
                            justifyContent: "center",
                        }}
                    >
                        <View style={GlobalStyles.card}>
                            <Text style={[GlobalStyles.label, { fontSize: 18 }]}>Log this reading</Text>
                            <Text style={GlobalStyles.muted}>
                                Word count: {wordCount.toLocaleString()}
                            </Text>

                            {CATEGORY_CHOICES.map((c) => (
                                <Pressable
                                    key={c.key}
                                    onPress={() => handlePick(c.key)}
                                    style={GlobalStyles.button}
                                >
                                    <Text style={GlobalStyles.buttonText}>{c.label}</Text>
                                </Pressable>
                            ))}

                            <Pressable onPress={() => setShowPicker(false)} style={GlobalStyles.button}>
                                <Text style={GlobalStyles.buttonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ReadingScreen;
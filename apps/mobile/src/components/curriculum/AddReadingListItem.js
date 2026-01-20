import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const TYPE_OPTIONS = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const AddReadingListItem = ({
    title,
    setTitle,
    url,
    setUrl,
    type,
    setType,
    onAdd,
    GlobalStyles,
    Colors,
}) => {
    return (
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

            <Pressable onPress={onAdd} style={GlobalStyles.button}>
                <Text style={GlobalStyles.buttonText}>Add Item</Text>
            </Pressable>
        </View>
    );
};

export default AddReadingListItem;
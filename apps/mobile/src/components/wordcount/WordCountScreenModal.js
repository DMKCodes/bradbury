import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

const WordCountScreenModal = ({
    visible,
    wordCount,
    choices,
    onPick,
    onCancel,
    GlobalStyles,
    Colors,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: Colors.overlay,
                    justifyContent: "flex-end",
                    padding: 16,
                }}
            >
                <Pressable style={{ ...{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } }} onPress={onCancel} />

                <View
                    style={[
                        GlobalStyles.card,
                        {
                            width: "100%",
                            maxHeight: 320,
                            paddingVertical: 14,
                            paddingHorizontal: 14,
                        },
                    ]}
                >
                    <Text style={[GlobalStyles.label, { fontSize: 18 }]}>Log this reading</Text>
                    <Text style={GlobalStyles.muted}>
                        Word count: {Number(wordCount || 0).toLocaleString()}
                    </Text>

                    <View style={{ height: 10 }} />

                    {choices.map((c) => (
                        <Pressable
                            key={c.key}
                            onPress={() => onPick?.(c.key)}
                            style={GlobalStyles.button}
                        >
                            <Text style={GlobalStyles.buttonText}>{c.label}</Text>
                        </Pressable>
                    ))}

                    <Pressable onPress={onCancel} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default WordCountScreenModal;
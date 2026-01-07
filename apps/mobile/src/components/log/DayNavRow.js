import React from "react";
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const DayNavRow = ({ canGoNext, onPrev, onToday, onNext, activeIsToday, Colors }) => {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={onPrev} style={{ padding: 8 }} hitSlop={10}>
                <FontAwesome name="chevron-left" size={18} color={Colors.text} />
            </Pressable>

            <Pressable onPress={onToday} style={{ paddingVertical: 8, paddingHorizontal: 12 }} hitSlop={10}>
                <Text style={{ fontWeight: "900", color: Colors.text }}>
                    {activeIsToday ? "Today" : "Go to Today"}
                </Text>
            </Pressable>

            <Pressable
                onPress={onNext}
                style={{ padding: 8, opacity: canGoNext ? 1.0 : 0.4 }}
                considered-disabled={(!canGoNext).toString()}
                disabled={!canGoNext}
                hitSlop={10}
            >
                <FontAwesome name="chevron-right" size={18} color={Colors.text} />
            </Pressable>
        </View>
    );
};

export default DayNavRow;
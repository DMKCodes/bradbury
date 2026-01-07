import React from "react";
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import DayStatusIcons from "./DayStatusIcons";

const LogHeaderCard = ({
    title = "Log",
    subtitle,
    essayDone,
    storyDone,
    poemDone,
    onOpenCalendar,
    GlobalStyles,
    Colors,
}) => {
    return (
        <View style={[GlobalStyles.card, { gap: 10 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                    <Text style={GlobalStyles.title}>{title}</Text>
                    <Text style={GlobalStyles.subtitle}>{subtitle}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <DayStatusIcons
                        essayDone={essayDone}
                        storyDone={storyDone}
                        poemDone={poemDone}
                        colors={Colors}
                    />

                    <Pressable onPress={onOpenCalendar} style={{ padding: 8 }} hitSlop={8}>
                        <FontAwesome name="calendar" size={20} color={Colors.text} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default LogHeaderCard;
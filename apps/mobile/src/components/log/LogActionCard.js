import React from "react";
import { Pressable, Text, View } from "react-native";

const LogActionCard = ({ activeDayKey, onPress, GlobalStyles, Colors }) => {
    const OK = Colors.ok ?? "#2ECC71";

    return (
        <View style={GlobalStyles.card}>
            <Pressable onPress={onPress} style={[GlobalStyles.button, { borderColor: OK }]}>
                <Text style={GlobalStyles.buttonText}>Log a Reading</Text>
            </Pressable>

            <Text style={GlobalStyles.muted}>
                This will log against{" "}
                <Text style={{ fontWeight: "900", color: Colors.text }}>{activeDayKey}</Text>.
            </Text>
        </View>
    );
};

export default LogActionCard;
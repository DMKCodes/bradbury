import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, GlobalStyles } from "../theme/theme";

const InsightsScreen = ({ navigation }) => {
    const openRoute = (name) => {
        const parent = navigation.getParent?.();
        if (parent) {
            parent.navigate(name);
            return;
        }
        navigation.navigate(name);
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Insights</Text>
                    <Text style={GlobalStyles.subtitle}>
                        History, Stats, and Books live here to keep the tab bar clean.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Quick links</Text>

                    <Pressable onPress={() => openRoute("History")} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>History</Text>
                        <Text style={GlobalStyles.muted}>Browse entries by year and category.</Text>
                    </Pressable>

                    <Pressable onPress={() => openRoute("Stats")} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Stats</Text>
                        <Text style={GlobalStyles.muted}>Streaks, totals, averages, per-type metrics.</Text>
                    </Pressable>

                    <Pressable onPress={() => openRoute("Books")} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>Books</Text>
                        <Text style={GlobalStyles.muted}>Track completed books separate from daily credit.</Text>
                    </Pressable>

                    <Text style={[GlobalStyles.muted, { marginTop: 6 }]}>
                        Tip: Use the gear icon for export and maintenance actions.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={[GlobalStyles.label, { color: Colors.accent }]}>Accent system</Text>
                    <Text style={GlobalStyles.muted}>
                        Amber is used for navigation focus; green is used for “completed”.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default InsightsScreen;
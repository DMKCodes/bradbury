import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const InsightsScreen = () => {
    const navigation = useNavigation();

    const openRoute = (name) => {
        const parent = navigation.getParent?.();
        if (parent) {
            parent.navigate(name);
            return;
        }
        navigation.navigate(name);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "600" }}>Insights</Text>
                    <Text style={{ opacity: 0.7 }}>
                        History and Stats are grouped here to keep the tab bar clean.
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
                    <Text style={{ fontWeight: "800" }}>Quick links</Text>

                    <Pressable
                        onPress={() => openRoute("History")}
                        style={{
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 10,
                        }}
                    >
                        <Text style={{ fontWeight: "800" }}>History</Text>
                        <Text style={{ opacity: 0.7 }}>
                            Browse entries, filter by year and category, edit/delete.
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => openRoute("Stats")}
                        style={{
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 10,
                        }}
                    >
                        <Text style={{ fontWeight: "800" }}>Stats</Text>
                        <Text style={{ opacity: 0.7 }}>
                            Streaks, totals, averages, and counts by category/year.
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => openRoute("Books")}
                        style={{
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 10,
                        }}
                    >
                        <Text style={{ fontWeight: "800" }}>Books</Text>
                        <Text style={{ opacity: 0.7 }}>
                            Track books completed (separate from daily Bradbury credit).
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default InsightsScreen;
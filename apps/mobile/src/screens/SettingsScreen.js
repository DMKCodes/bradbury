import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import { GlobalStyles } from "../theme/theme";

const BRADBURY_PREFIX = "bradbury_";

const SettingsScreen = () => {
    const [busy, setBusy] = useState(false);

    const exportToClipboard = async () => {
        setBusy(true);

        try {
            const keys = await AsyncStorage.getAllKeys();
            const targetKeys = keys.filter((k) => String(k).startsWith(BRADBURY_PREFIX));

            const pairs = await AsyncStorage.multiGet(targetKeys);

            const data = {};
            for (const [k, v] of pairs) {
                data[k] = v;
            }

            const exportObj = {
                exportedAt: new Date().toISOString(),
                keys: targetKeys,
                data,
            };

            const json = JSON.stringify(exportObj, null, 2);
            await Clipboard.setStringAsync(json);

            Alert.alert("Export copied", `Copied ${targetKeys.length} key(s) to clipboard as JSON.`);
        } catch (err) {
            console.error(err);
            Alert.alert("Export failed", "Unable to export local data.");
        } finally {
            setBusy(false);
        }
    };

    const clearLocalData = async () => {
        Alert.alert(
            "Clear local data?",
            "This will delete all local Bradbury app data from this device. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const keys = await AsyncStorage.getAllKeys();
                            const targetKeys = keys.filter((k) => String(k).startsWith(BRADBURY_PREFIX));
                            await AsyncStorage.multiRemove(targetKeys);

                            Alert.alert("Cleared", `Deleted ${targetKeys.length} key(s).`);
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Failed", "Unable to clear local data.");
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Settings</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Export and app maintenance actions.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Data</Text>

                    <Pressable onPress={exportToClipboard} disabled={busy} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>
                            {busy ? "Working..." : "Copy Export JSON to Clipboard"}
                        </Text>
                        <Text style={GlobalStyles.muted}>
                            Exports all local keys beginning with ${BRADBURY_PREFIX}.
                        </Text>
                    </Pressable>

                    <Pressable onPress={clearLocalData} disabled={busy} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>
                            {busy ? "Working..." : "Clear Local Data"}
                        </Text>
                        <Text style={GlobalStyles.muted}>
                            Deletes all local Bradbury app data from this device.
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
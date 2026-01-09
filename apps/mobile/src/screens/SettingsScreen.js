import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { GlobalStyles } from "../theme/theme";
import { clearBradburyData, exportBradburyData, importBradburyData } from "../lib/backupUtils";

const SettingsScreen = () => {
    const [busy, setBusy] = useState(false);
    const [importJson, setImportJson] = useState("");

    const exportToClipboard = async () => {
        setBusy(true);

        try {
            const exportObj = await exportBradburyData();
            const json = JSON.stringify(exportObj, null, 2);
            await Clipboard.setStringAsync(json);

            Alert.alert("Export copied", `Copied ${exportObj.keys.length} key(s) to clipboard as JSON.`);
        } catch (err) {
            console.error(err);
            Alert.alert("Export failed", "Unable to export local data.");
        } finally {
            setBusy(false);
        }
    };

    const pasteFromClipboard = async () => {
        try {
            const str = await Clipboard.getStringAsync();
            setImportJson(String(str || ""));
        } catch (err) {
            console.error(err);
            Alert.alert("Paste failed", "Unable to read clipboard.");
        }
    };

    const confirmImport = (mode) => {
        const label = mode === "replace" ? "Replace" : "Merge";

        if (!String(importJson || "").trim()) {
            Alert.alert("Nothing to import", "Paste your exported JSON into the box first.");
            return;
        }

        Alert.alert(
            `Import (${label})?`,
            mode === "replace"
                ? "This will delete existing Bradbury data on this device, then import the pasted backup."
                : "This will import keys from the pasted backup without deleting other local Bradbury data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Import",
                    style: mode === "replace" ? "destructive" : "default",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const res = await importBradburyData({ json: importJson, mode });
                            if (!res.ok) {
                                Alert.alert("Import failed", res.error || "Unable to import.");
                                return;
                            }

                            Alert.alert(
                                "Import complete",
                                `Imported ${res.imported} key(s).\nSet: ${res.set}\nRemoved: ${res.removed}`
                            );
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Import failed", "Unable to import local data.");
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
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
                            const res = await clearBradburyData();
                            Alert.alert("Cleared", `Deleted ${res.deleted} key(s).`);
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
                        Export and maintenance actions.
                    </Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Backup</Text>

                    <Pressable onPress={exportToClipboard} disabled={busy} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>
                            {busy ? "Working..." : "Copy Export JSON to Clipboard"}
                        </Text>
                        <Text style={GlobalStyles.muted}>
                            Exports all local keys to clipboard in JSON format.
                        </Text>
                    </Pressable>

                    <View style={{ height: 10 }} />

                    <Text style={GlobalStyles.label}>Import</Text>
                    <Text style={GlobalStyles.muted}>
                        Paste the JSON export here, then import. Use Replace after reinstalling the app.
                    </Text>

                    <TextInput
                        value={importJson}
                        onChangeText={setImportJson}
                        placeholder="Paste export JSON here..."
                        placeholderTextColor={"#999"}
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[GlobalStyles.input, { minHeight: 160, textAlignVertical: "top" }]}
                    />

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                        <Pressable onPress={pasteFromClipboard} disabled={busy} style={GlobalStyles.button}>
                            <Text style={GlobalStyles.buttonText}>Paste from Clipboard</Text>
                        </Pressable>

                        <Pressable onPress={() => confirmImport("merge")} disabled={busy} style={GlobalStyles.button}>
                            <Text style={GlobalStyles.buttonText}>Import (Merge)</Text>
                        </Pressable>

                        <Pressable onPress={() => confirmImport("replace")} disabled={busy} style={GlobalStyles.button}>
                            <Text style={GlobalStyles.buttonText}>Import (Replace)</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={GlobalStyles.label}>Danger Zone</Text>

                    <Pressable onPress={clearLocalData} disabled={busy} style={GlobalStyles.button}>
                        <Text style={GlobalStyles.buttonText}>
                            {busy ? "Working..." : "Clear Local Data"}
                        </Text>
                        <Text style={GlobalStyles.muted}>
                            Deletes all local data from this device.
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
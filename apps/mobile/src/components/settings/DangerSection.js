import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { GlobalStyles } from "../../theme/theme";
import { clearBradburyData } from "../../lib/backupUtils";

/**
 * DangerZoneSection
 *
 * Owns:
 * - destructive local reset ("clear local data")
 */
const DangerZoneSection = () => {
    const [busy, setBusy] = useState(false);

    const clearLocalData = () => {
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
    );
};

export default DangerZoneSection;
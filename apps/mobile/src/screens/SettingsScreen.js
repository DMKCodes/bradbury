import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlobalStyles } from "../theme/theme";

import ServerSection from "../components/settings/ServerSection";
import BackupSection from "../components/settings/BackupSection";
import DangerZoneSection from "../components/settings/DangerSection";

const SettingsScreen = () => {
    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <ScrollView contentContainerStyle={GlobalStyles.content}>
                <View style={{ gap: 4 }}>
                    <Text style={GlobalStyles.title}>Settings</Text>
                    <Text style={GlobalStyles.subtitle}>
                        Export, server connectivity, and maintenance actions.
                    </Text>
                </View>

                <ServerSection />
                <BackupSection />
                <DangerZoneSection />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
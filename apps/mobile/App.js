import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
    getCurrentProfile,
    resetAllLocalData,
    setCurrentProfileId,
    exportAllLocalData,
} from "./src/lib/store";

import ProfileScreen from "./src/screens/ProfileScreen";
import LogScreen from "././src/screens/LogScreen";
import StatsScreen from "./src/screens/StatsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ReadingScreen from "./src/screens/ReadingScreen";
import CurriculumScreen from "./src/screens/CurriculumScreen";
import CurriculumTopicScreen from "./src/screens/CurriculumTopicScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const handleExportData = async () => {
    try {
        const payload = await exportAllLocalData();
        const json = JSON.stringify(payload, null, 2);

        await Clipboard.setStringAsync(json);

        Alert.alert(
            "Export copied",
            `Copied ${json.length.toLocaleString()} characters to clipboard.\n\nPaste into a notes app or a file for backup.`
        );
    } catch (err) {
        console.error(err);
        Alert.alert("Export failed", "Unable to export local data.");
    }
};

const AccountScreen = ({
    profile,
    onSwitchProfile,
    onResetData,
    onExportData,
}) => {
    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "600" }}>Account</Text>
                <Text style={{ opacity: 0.7 }}>
                    Current profile: {profile?.displayName} ({profile?.id})
                </Text>

                <View style={{ height: 8 }} />

                <Button title="Switch profile" onPress={onSwitchProfile} />
                <View style={{ height: 8 }} />

                <Button title="Export local data to clipboard" onPress={onExportData} />
                <View style={{ height: 8 }} />

                <Button title="Reset all local data" onPress={onResetData} />
            </View>
        </SafeAreaView>
    );
};

const MainTabs = ({ profile, onSwitchProfile, onResetData, onExportData }) => {
    return (
        <Tabs.Navigator>
            <Tabs.Screen name="Log">
                {() => <LogScreen profile={profile} />}
            </Tabs.Screen>

            <Tabs.Screen name="Read" component={ReadingScreen} />

            <Tabs.Screen name="Curriculum" component={CurriculumScreen} />

            <Tabs.Screen name="History" component={HistoryScreen} />

            <Tabs.Screen name="Stats" component={StatsScreen} />

            <Tabs.Screen name="Account">
                {() => (
                    <AccountScreen
                        profile={profile}
                        onSwitchProfile={onSwitchProfile}
                        onResetData={onResetData}
                        onExportData={onExportData}
                    />
                )}
            </Tabs.Screen>
        </Tabs.Navigator>
    );
};

const App = () => {
    const [bootState, setBootState] = useState("booting");
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            try {
                const p = await getCurrentProfile();
                if (!cancelled) setProfile(p);
            } finally {
                if (!cancelled) setBootState("ready");
            }
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSwitchProfile = async () => {
        await setCurrentProfileId(null);
        setProfile(null);
    };

    const handleResetData = async () => {
        await resetAllLocalData();
        await setCurrentProfileId(null);
        setProfile(null);
    };

    if (bootState !== "ready") {
        return (
            <SafeAreaProvider>
                <SafeAreaView
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ActivityIndicator />
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    {!profile ? (
                        <Stack.Screen
                            name="Profile"
                            options={{ headerShown: false }}
                        >
                            {() => <ProfileScreen onSelected={setProfile} />}
                        </Stack.Screen>
                    ) : (
                        <Stack.Screen
                            name="Main"
                            options={{ headerShown: false }}
                        >
                            {() => (
                                <MainTabs
                                    profile={profile}
                                    onSwitchProfile={handleSwitchProfile}
                                    onResetData={handleResetData}
                                    onExportData={handleExportData}
                                />
                            )}
                        </Stack.Screen>
                    )}
                    <Stack.Screen
                        name="CurriculumTopic"
                        component={CurriculumTopicScreen}
                        options={{ title: "Topic" }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
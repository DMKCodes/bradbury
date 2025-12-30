import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
    getCurrentProfile,
    resetAllLocalData,
    setCurrentProfileId,
} from "./src/lib/store";

import ProfileScreen from "./src/screens/ProfileScreen";
import TodayScreen from "./src/screens/TodayScreen";
import StatsScreen from "./src/screens/StatsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AccountScreen = ({ profile, onSwitchProfile, onResetData }) => {
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
                <Button title="Reset all local data" onPress={onResetData} />
            </View>
        </SafeAreaView>
    );
};

const MainTabs = ({ profile, onSwitchProfile, onResetData }) => {
    return (
        <Tabs.Navigator>
            <Tabs.Screen name="Today">
                {() => <TodayScreen profile={profile} />}
            </Tabs.Screen>

            <Tabs.Screen name="History" component={HistoryScreen} />

            <Tabs.Screen name="Stats" component={StatsScreen} />

            <Tabs.Screen name="Account">
                {() => (
                    <AccountScreen
                        profile={profile}
                        onSwitchProfile={onSwitchProfile}
                        onResetData={onResetData}
                    />
                )}
            </Tabs.Screen>
        </Tabs.Navigator>
    );
};

const App = () => {
    const [bootState, setBootState] = useState("booting"); // booting | ready
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
                                />
                            )}
                        </Stack.Screen>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
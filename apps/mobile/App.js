import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { authStorage, me, logout } from "./src/lib/api";

import LoginScreen from "./src/screens/LoginScreen";
import TodayScreen from "./src/screens/TodayScreen";
import StatsScreen from "./src/screens/StatsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AccountScreen = ({ user, onLogout }) => {
    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "600" }}>Account</Text>
                <Text style={{ opacity: 0.7 }}>
                    Signed in as: {user?.displayName}
                </Text>

                <View style={{ height: 12 }} />

                <Button title="Log out" onPress={onLogout} />
            </View>
        </SafeAreaView>
    );
};

const MainTabs = ({ user, onLogout }) => {
    return (
        <Tabs.Navigator>
            <Tabs.Screen name="Today">
                {() => <TodayScreen user={user} />}
            </Tabs.Screen>

            <Tabs.Screen name="Stats" component={StatsScreen} />

            <Tabs.Screen name="Account">
                {() => <AccountScreen user={user} onLogout={onLogout} />}
            </Tabs.Screen>

            <Tabs.Screen name="History" component={HistoryScreen} />
        </Tabs.Navigator>
    );
};

const App = () => {
    const [bootState, setBootState] = useState("booting");
    const [user, setUser] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            const token = await authStorage.getToken();

            if (token) {
                try {
                    const u = await me();
                    if (!cancelled) setUser(u);
                } catch {
                    await authStorage.clear();
                    if (!cancelled) setUser(null);
                }
            }

            if (!cancelled) setBootState("ready");
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        setUser(null);
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
                    {!user ? (
                        <Stack.Screen
                            name="Login"
                            options={{ headerShown: false }}
                        >
                            {() => <LoginScreen onAuthed={setUser} />}
                        </Stack.Screen>
                    ) : (
                        <Stack.Screen
                            name="Main"
                            options={{ headerShown: false }}
                        >
                            {() => (
                                <MainTabs
                                    user={user}
                                    onLogout={handleLogout}
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
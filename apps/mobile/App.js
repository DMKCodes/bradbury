import React from "react";
import { Pressable } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";

import { Colors } from "./src/theme/theme";

import LogScreen from "./src/screens/LogScreen";
import WordCountScreen from "./src/screens/WordCountScreen";
import CurriculumScreen from "./src/screens/CurriculumScreen";
import CurriculumTopicScreen from "./src/screens/CurriculumTopicScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: Colors.bg,
        card: Colors.surface,
        text: Colors.text,
        border: Colors.border,
        primary: Colors.accent,
    },
};

const headerCommonOptions = {
    headerStyle: { backgroundColor: Colors.surface },
    headerTitleStyle: { color: Colors.text },
    headerTintColor: Colors.text,
};

const headerRightSettingsButton = (navigation) => {
    return (
        <Pressable
            onPress={() => {
                const parent = navigation.getParent?.();
                if (parent) {
                    parent.navigate("Settings");
                    return;
                }
                navigation.navigate("Settings");
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            hitSlop={10}
        >
            <FontAwesome name="cog" size={20} color={Colors.text} />
        </Pressable>
    );
};

const getTabIconName = (routeName) => {
    switch (routeName) {
        case "Log":
            return "pencil";
        case "WordCount":
            return "file-text";
        case "Insights":
            return "bar-chart";
        case "Curriculum":
            return "graduation-cap";
        default:
            return "circle";
    }
};

const MainTabs = () => {
    return (
        <Tabs.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                ...headerCommonOptions,

                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                },
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.mutedText,

                tabBarIcon: ({ color, size }) => {
                    const name = getTabIconName(route.name);
                    return <FontAwesome name={name} size={size ?? 20} color={color} />;
                },
            })}
        >
            <Tabs.Screen
                name="Log"
                component={LogScreen}
                options={({ navigation }) => ({
                    title: "Log",
                    headerRight: () => headerRightSettingsButton(navigation),
                })}
            />

            <Tabs.Screen
                name="WordCount"
                component={WordCountScreen}
                options={({ navigation }) => ({
                    title: "Word Count",
                    headerRight: () => headerRightSettingsButton(navigation),
                })}
            />

            <Tabs.Screen
                name="Insights"
                component={InsightsScreen}
                options={({ navigation }) => ({
                    title: "Insights",
                    headerRight: () => headerRightSettingsButton(navigation),
                })}
            />

            <Tabs.Screen
                name="Curriculum"
                component={CurriculumScreen}
                options={{
                    title: "Curriculum",
                }}
            />
        </Tabs.Navigator>
    );
};

const App = () => {
    return (
        <NavigationContainer theme={AppTheme}>
            <Stack.Navigator screenOptions={headerCommonOptions}>
                <Stack.Screen
                    name="Main"
                    component={MainTabs}
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: "Settings" }}
                />

                <Stack.Screen
                    name="History"
                    component={HistoryScreen}
                    options={{ title: "History" }}
                />

                <Stack.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{ title: "Stats" }}
                />

                <Stack.Screen
                    name="CurriculumTopic"
                    component={CurriculumTopicScreen}
                    options={{ title: "Topic" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
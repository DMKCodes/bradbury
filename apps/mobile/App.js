import React from "react";
import { Pressable, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LogScreen from "./src/screens/LogScreen";
import ReadingScreen from "./src/screens/ReadingScreen";
import CurriculumScreen from "./src/screens/CurriculumScreen";
import CurriculumTopicScreen from "./src/screens/CurriculumTopicScreen";

import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BooksScreen from "./src/screens/BooksScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

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
        >
            <Text style={{ fontWeight: "800" }}>Settings</Text>
        </Pressable>
    );
};

const MainTabs = () => {
    return (
        <Tabs.Navigator
            screenOptions={{
                headerShown: true,
            }}
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
                name="Reading"
                component={ReadingScreen}
                options={({ navigation }) => ({
                    title: "Reading",
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
        <NavigationContainer>
            <Stack.Navigator>
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

                <Stack.Screen
                    name="Books"
                    component={BooksScreen}
                    options={{ title: "Books" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
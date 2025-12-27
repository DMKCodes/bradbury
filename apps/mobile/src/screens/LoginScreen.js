import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login } from "../lib/api";

const LoginScreen = ({ onAuthed }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        if (!username.trim() || !password) {
            Alert.alert("Missing info", "Please enter username and password.");
            return;
        }

        try {
            setSubmitting(true);
            const user = await login(username.trim(), password);
            onAuthed(user);
        } catch (err) {
            const message =
                err?.message === "invalid_credentials"
                    ? "Invalid username or password."
                    : "Login failed. Please try again.";
            Alert.alert("Sign in failed", message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <View style={{ gap: 12, marginTop: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: "600" }}>Sign in</Text>
                <Text style={{ opacity: 0.7 }}>
                    Use the hardcoded credentials from apps/api/.env
                </Text>

                <View style={{ gap: 6 }}>
                    <Text>Username</Text>
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="doug"
                        style={{
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            padding: 10,
                        }}
                        editable={!submitting}
                    />
                </View>

                <View style={{ gap: 6 }}>
                    <Text>Password</Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••••"
                        style={{
                            borderWidth: 1,
                            borderColor: "#999",
                            borderRadius: 8,
                            padding: 10,
                        }}
                        editable={!submitting}
                    />
                </View>

                <Button
                    title={submitting ? "Signing in…" : "Sign in"}
                    onPress={onSubmit}
                    disabled={submitting}
                />
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { GlobalStyles } from "../../theme/theme";

import { getApiBaseUrl, getDefaultApiBaseUrl, setApiBaseUrl } from "../../lib/serverConfig";
import { getToken } from "../../lib/serverAuth";
import { healthCheck, login, logout, me, register } from "../../lib/serverApi";
import { hydrateFromServer } from "../../lib/serverHydrate";
import { uploadLocalEntriesToServer } from "../../lib/serverSyncEntries";
import { uploadLocalCurriculumToServer } from "../../lib/serverSyncCurriculum";
import { pullLatestMerge } from "../../lib/serverPull";

/**
 * ServerSection
 *
 * Purpose:
 * - Configure the API base URL for mobile
 * - Provide auth (register/login/logout)
 * - Provide test calls (health + /auth/me)
 * - Provide "hydrate from server" action (replace local stores)
 * - Manual upload local entries & curriculum -> server
 * - Manual upload local curriculum -> server
 * - Pull latest from server and merge into local (non-destructive)
 */

const ServerSection = () => {
    const [busy, setBusy] = useState(false);

    // Server config
    const [apiBaseUrl, setApiBaseUrlState] = useState("");
    const defaultBaseUrl = useMemo(() => getDefaultApiBaseUrl(), []);

    // Auth input
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Display state
    const [tokenPresent, setTokenPresent] = useState(false);
    const [entriesProgress, setEntriesProgress] = useState(null);
    const [curriculumProgress, setCurriculumProgress] = useState(null);

    const refreshTokenPresent = async () => {
        try {
            const t = await getToken();
            setTokenPresent(Boolean(t));
        } catch {
            setTokenPresent(false);
        }
    };

    const loadServerConfig = async () => {
        const current = await getApiBaseUrl();
        setApiBaseUrlState(current);
        await refreshTokenPresent();
    };

    useEffect(() => {
        loadServerConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSaveBaseUrl = async () => {
        setBusy(true);
        try {
            const res = await setApiBaseUrl(apiBaseUrl);
            await loadServerConfig();

            Alert.alert(
                "Saved",
                res.cleared
                    ? `Cleared override.\nUsing default:\n${defaultBaseUrl}`
                    : `Saved API base URL:\n${String(apiBaseUrl || "").trim()}`
            );
        } catch (err) {
            console.error(err);
            Alert.alert("Save failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const onHealthCheck = async () => {
        setBusy(true);
        try {
            const res = await healthCheck();
            Alert.alert("Health OK", JSON.stringify(res, null, 2));
        } catch (err) {
            console.error(err);
            Alert.alert("Health failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const onRegister = async () => {
        const safeEmail = String(email || "").trim();
        const safePass = String(password || "");

        if (!safeEmail || !safePass) {
            Alert.alert("Missing fields", "Enter email and password.");
            return;
        }

        setBusy(true);
        try {
            const res = await register({ email: safeEmail, password: safePass });
            if (res?.token) {
                await refreshTokenPresent();
            }
            Alert.alert("Registered", "Registration succeeded.");
        } catch (err) {
            console.error(err);
            Alert.alert("Register failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const onLogin = async () => {
        const safeEmail = String(email || "").trim();
        const safePass = String(password || "");

        if (!safeEmail || !safePass) {
            Alert.alert("Missing fields", "Enter email and password.");
            return;
        }

        setBusy(true);
        try {
            await login({ email: safeEmail, password: safePass });
            await refreshTokenPresent();
            Alert.alert("Logged in", "Token stored on device (not included in exports).");
        } catch (err) {
            console.error(err);
            Alert.alert("Login failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const onLogout = async () => {
        setBusy(true);
        try {
            await logout();
            await refreshTokenPresent();
            Alert.alert("Logged out", "Token cleared from device.");
        } catch (err) {
            console.error(err);
            Alert.alert("Logout failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const onMe = async () => {
        setBusy(true);
        try {
            const res = await me();
            Alert.alert("Me", JSON.stringify(res, null, 2));
        } catch (err) {
            console.error(err);
            Alert.alert("Me failed", String(err?.message || err));
        } finally {
            setBusy(false);
        }
    };

    const confirmHydrateReplace = () => {
        if (!tokenPresent) {
            Alert.alert("Not logged in", "Login first so the app can fetch your data from the server.");
            return;
        }

        Alert.alert(
            "Hydrate from server (replace local)?",
            "This will overwrite local Entries + Curriculum with the server versions.\n\nTip: Export your local data first if you need a copy.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Replace local",
                    style: "destructive",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const res = await hydrateFromServer({ mode: "replace" });
                            Alert.alert(
                                "Hydration complete",
                                `Entries: ${res.entriesCount}\nTopics: ${res.topicsCount}`
                            );
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Hydration failed", String(err?.message || err));
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    const confirmUploadLocalEntries = () => {
        if (!tokenPresent) {
            Alert.alert("Not logged in", "Login first so the app can upload your local entries to the server.");
            return;
        }

        Alert.alert(
            "Upload local entries to server?",
            "This will read your local entries and upsert them to the server.\n\nFor now, local is treated as the source of truth (offline-first).",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Upload",
                    onPress: async () => {
                        setBusy(true);
                        setEntriesProgress({ uploaded: 0, skipped: 0, failed: 0, total: 0 });

                        try {
                            const res = await uploadLocalEntriesToServer({
                                onProgress: (p) => setEntriesProgress(p),
                            });

                            Alert.alert(
                                "Upload complete",
                                `Total considered: ${res.total}\nUploaded: ${res.uploaded}\nSkipped: ${res.skipped}\nFailed: ${res.failed}${
                                    res.firstError ? `\n\nFirst error:\n${res.firstError}` : ""
                                }`
                            );
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Upload failed", String(err?.message || err));
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    const confirmUploadLocalCurriculum = () => {
        if (!tokenPresent) {
            Alert.alert("Not logged in", "Login first so the app can upload your curriculum to the server.");
            return;
        }

        Alert.alert(
            "Upload curriculum to server?",
            "This will upsert your local Topics + Topic Items to the server using stable clientIds.\n\nSafe to run multiple times.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Upload",
                    onPress: async () => {
                        setBusy(true);
                        setCurriculumProgress({ topicsUpserted: 0, itemsUpserted: 0, skipped: 0, failed: 0, totalTopics: 0 });

                        try {
                            const res = await uploadLocalCurriculumToServer({
                                onProgress: (p) => setCurriculumProgress(p),
                            });

                            Alert.alert(
                                "Curriculum upload complete",
                                `Topics considered: ${res.totalTopics}\nTopics upserted: ${res.topicsUpserted}\nItems upserted: ${res.itemsUpserted}\nSkipped: ${res.skipped}\nFailed: ${res.failed}${
                                    res.firstError ? `\n\nFirst error:\n${res.firstError}` : ""
                                }`
                            );
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Upload failed", String(err?.message || err));
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    const confirmPullLatestMerge = () => {
        if (!tokenPresent) {
            Alert.alert("Not logged in", "Login first so the app can pull your data from the server.");
            return;
        }

        Alert.alert(
            "Pull latest from server (merge into local)?",
            "This will download server Entries + Curriculum and merge into your local storage.\n\nLocal-only items will be kept.\nConflicts resolve by latest updatedAt.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Pull + Merge",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const res = await pullLatestMerge();

                            Alert.alert(
                                "Pull complete",
                                `Entries: +${res.entries.added} added, ${res.entries.updated} updated\n` +
                                `Curriculum: +${res.curriculum.topicsAdded} topics, ${res.curriculum.topicsUpdated} topics updated\n` +
                                `Items: +${res.curriculum.itemsAdded} items, ${res.curriculum.itemsUpdated} items updated`
                            );
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Pull failed", String(err?.message || err));
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
            <Text style={GlobalStyles.label}>Server</Text>

            <Text style={GlobalStyles.muted}>
                Configure API base URL for mobile. This differs from web because mobile can’t always reach &quot;localhost&quot;.
            </Text>

            <Text style={[GlobalStyles.muted, { marginTop: 6 }]}>
                Default: {defaultBaseUrl}
            </Text>

            <TextInput
                value={apiBaseUrl}
                onChangeText={setApiBaseUrlState}
                placeholder={defaultBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
                style={GlobalStyles.input}
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                <Pressable onPress={onSaveBaseUrl} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>
                        {busy ? "Working..." : "Save API Base URL"}
                    </Text>
                </Pressable>

                <Pressable onPress={onHealthCheck} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>Test /health</Text>
                </Pressable>
            </View>

            <View style={{ height: 14 }} />

            <Text style={GlobalStyles.label}>Auth</Text>
            <Text style={GlobalStyles.muted}>
                {tokenPresent ? "Token: present (logged in)" : "Token: not present (logged out)"}
            </Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={GlobalStyles.input}
            />

            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={GlobalStyles.input}
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                <Pressable onPress={onRegister} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>Register</Text>
                </Pressable>

                <Pressable onPress={onLogin} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>Login</Text>
                </Pressable>

                <Pressable onPress={onLogout} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>Logout</Text>
                </Pressable>

                <Pressable onPress={onMe} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>GET /auth/me</Text>
                </Pressable>
            </View>

            <View style={{ height: 14 }} />

            <Text style={GlobalStyles.label}>Hydration (Phase 1)</Text>
            <Text style={GlobalStyles.muted}>
                Downloads Entries + Curriculum from the server and writes them into local storage (replace-only).
            </Text>

            <View style={{ marginTop: 10 }}>
                <Pressable onPress={confirmHydrateReplace} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>
                        {busy ? "Working..." : "Hydrate from Server (Replace Local)"}
                    </Text>
                </Pressable>
            </View>

            <View style={{ height: 14 }} />

            <Text style={GlobalStyles.label}>Manual Sync (Phase 2A)</Text>
            <Text style={GlobalStyles.muted}>
                Uploads your local Entries to the server via /entries/upsert (offline-first).
            </Text>

            {entriesProgress ? (
                <Text style={[GlobalStyles.muted, { marginTop: 8 }]}>
                    Progress: {entriesProgress.uploaded}/{entriesProgress.total} uploaded
                    {"  "}•{"  "}
                    {entriesProgress.skipped} skipped
                    {"  "}•{"  "}
                    {entriesProgress.failed} failed
                </Text>
            ) : null}

            <View style={{ marginTop: 10 }}>
                <Pressable onPress={confirmUploadLocalEntries} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>
                        {busy ? "Working..." : "Upload Local Entries → Server"}
                    </Text>
                </Pressable>
            </View>

            <View style={{ height: 14 }} />

            <Text style={GlobalStyles.label}>Manual Sync (Phase 2B)</Text>
            <Text style={GlobalStyles.muted}>
                Uploads your local Curriculum (Topics + Items) to the server using stable clientIds.
            </Text>

            {curriculumProgress ? (
                <Text style={[GlobalStyles.muted, { marginTop: 8 }]}>
                    Topics: {curriculumProgress.topicsUpserted}/{curriculumProgress.totalTopics} upserted
                    {"  "}•{"  "}
                    Items: {curriculumProgress.itemsUpserted} upserted
                    {"  "}•{"  "}
                    {curriculumProgress.skipped} skipped
                    {"  "}•{"  "}
                    {curriculumProgress.failed} failed
                </Text>
            ) : null}

            <View style={{ marginTop: 10 }}>
                <Pressable onPress={confirmUploadLocalCurriculum} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>
                        {busy ? "Working..." : "Upload Curriculum → Server"}
                    </Text>
                </Pressable>
            </View>

            <View style={{ height: 14 }} />

            <Text style={GlobalStyles.label}>Pull Latest (Phase 3A)</Text>
            <Text style={GlobalStyles.muted}>
                Downloads server Entries + Curriculum and merges into local storage (non-destructive).
                Conflicts resolve by latest updatedAt.
            </Text>

            <View style={{ marginTop: 10 }}>
                <Pressable onPress={confirmPullLatestMerge} disabled={busy} style={GlobalStyles.button}>
                    <Text style={GlobalStyles.buttonText}>
                        {busy ? "Working..." : "Pull Latest → Merge into Local"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default ServerSection;
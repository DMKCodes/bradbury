import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getProfiles, setCurrentProfileId } from "../lib/store";

const ProfileScreen = ({ onSelected }) => {
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        const load = async () => {
            const p = await getProfiles();
            setProfiles(p);
        };
        load();
    }, []);

    const selectProfile = async (profile) => {
        await setCurrentProfileId(profile.id);
        onSelected(profile);
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <View style={{ gap: 12, marginTop: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: "600" }}>
                    Choose profile
                </Text>
                <Text style={{ opacity: 0.7 }}>
                    For alpha testing, profiles are local to this device.
                </Text>

                <View style={{ gap: 10 }}>
                    {profiles.map((p) => (
                        <Pressable
                            key={p.id}
                            onPress={() => selectProfile(p)}
                            style={{
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: "#999",
                                borderRadius: 10,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700" }}>
                                {p.displayName}
                            </Text>
                            <Text style={{ opacity: 0.7 }}>
                                id: {p.id}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;
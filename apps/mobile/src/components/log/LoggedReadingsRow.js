import React from "react";
import { Pressable, Text, View } from "react-native";

const CATEGORIES = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const LoggedReadingsRow = ({
    entriesByCategory,
    onEdit,
    onDelete,
    GlobalStyles,
    Colors,
}) => {
    const OK = Colors.ok ?? "#2ECC71";
    const OK_BG = Colors.okBg ?? "rgba(46, 204, 113, 0.12)";
    const DANGER = Colors.danger ?? "#E74C3C";
    const MUTED = Colors.mutedText ?? "#A0A0A0";

    const cards = CATEGORIES
        .map((c) => {
            const entry = entriesByCategory?.get?.(c.key) ?? null;
            if (!entry) return null;

            const title = String(entry.title || "");
            const author = String(entry.author || "");
            const url = String(entry.url || "");
            const rating = Number.isFinite(entry.rating) ? entry.rating : 5;
            const wc = entry.wordCount === null || entry.wordCount === undefined ? "" : String(entry.wordCount);

            return (
                <View
                    key={c.key}
                    style={[
                        GlobalStyles.card,
                        {
                            width: "100%",
                            borderColor: OK,
                            backgroundColor: OK_BG,
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            marginBottom: 10,
                        },
                    ]}
                >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[GlobalStyles.label, { marginBottom: 0 }]}>{c.label}</Text>

                        <Text style={[GlobalStyles.muted, { color: MUTED }]}>
                            Rating: {rating}/5
                        </Text>
                    </View>

                    <Text style={[GlobalStyles.title, { fontSize: 16, marginTop: 4 }]} numberOfLines={1}>
                        {title}
                    </Text>

                    <Text style={[GlobalStyles.muted, { marginTop: 2 }]} numberOfLines={1}>
                        {author ? `by ${author}` : "—"}
                    </Text>

                    {url ? (
                        <Text style={[GlobalStyles.muted, { marginTop: 2 }]} numberOfLines={1}>
                            {url}
                        </Text>
                    ) : null}

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                        <Text style={GlobalStyles.muted}>Words: {wc || "—"}</Text>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <Pressable
                                onPress={() => onEdit?.(c.key)}
                                style={[GlobalStyles.pill, { borderColor: Colors.border, paddingVertical: 6, paddingHorizontal: 10 }]}
                            >
                                <Text style={{ fontWeight: "800", color: Colors.text }}>Edit</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => onDelete?.(c.key)}
                                style={[GlobalStyles.pill, { borderColor: DANGER, paddingVertical: 6, paddingHorizontal: 10 }]}
                            >
                                <Text style={{ fontWeight: "800", color: DANGER }}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            );
        })
        .filter(Boolean);

    if (cards.length === 0) {
        return (
            <View style={GlobalStyles.card}>
                <Text style={GlobalStyles.muted}>No readings logged for this day yet.</Text>
            </View>
        );
    }

    return <View style={{ width: "100%" }}>{cards}</View>;
};

export default LoggedReadingsRow;
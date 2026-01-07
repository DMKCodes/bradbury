import React, { useMemo } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";

const TYPE_OPTIONS = [
    { key: "book", label: "Book" },
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

const ReadingListItemCard = ({
    items,
    loading,
    onToggle,
    onDelete,
    GlobalStyles,
    Colors,
}) => {
    const sortedItems = useMemo(() => {
        const arr = Array.isArray(items) ? items : [];

        // Stable sort: preserve original ordering within unfinished/finished groups.
        return arr
            .map((item, index) => ({ item, index }))
            .sort((a, b) => {
                const af = a.item?.finished ? 1 : 0;
                const bf = b.item?.finished ? 1 : 0;
                if (af !== bf) return af - bf;

                // If an explicit order exists, prefer it (otherwise preserve original order).
                const ao = Number.isFinite(a.item?.order) ? a.item.order : null;
                const bo = Number.isFinite(b.item?.order) ? b.item.order : null;

                if (ao !== null && bo !== null && ao !== bo) return ao - bo;
                if (ao !== null && bo === null) return -1;
                if (ao === null && bo !== null) return 1;

                return a.index - b.index;
            })
            .map((x) => x.item);
    }, [items]);

    const openUrl = async (u) => {
        const safe = String(u || "").trim();
        if (!safe) return;

        try {
            const supported = await Linking.canOpenURL(safe);
            if (!supported) {
                Alert.alert("Can't open link", "This URL could not be opened.");
                return;
            }
            await Linking.openURL(safe);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Unable to open this URL.");
        }
    };

    return (
        <View style={GlobalStyles.card}>
            <Text style={GlobalStyles.label}>
                Items {loading ? "(loading...)" : `(${sortedItems.length})`}
            </Text>

            {sortedItems.length === 0 && !loading ? (
                <Text style={GlobalStyles.muted}>
                    No items yet. Add your first reading list item above.
                </Text>
            ) : null}

            {sortedItems.map((item) => {
                const finished = Boolean(item.finished);

                return (
                    <View
                        key={item.id}
                        style={{
                            borderTopWidth: 1,
                            borderTopColor: Colors.border,
                            paddingTop: 10,
                            gap: 6,
                            opacity: finished ? 0.75 : 1,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                            {finished ? "✓ " : ""}{item.title}
                        </Text>

                        <Text style={GlobalStyles.muted}>
                            Type: {TYPE_OPTIONS.find((x) => x.key === item.type)?.label || item.type}
                        </Text>

                        {item.url ? (
                            <Pressable onPress={() => openUrl(item.url)}>
                                <Text style={{ color: Colors.accent2 }}>
                                    {item.url}
                                </Text>
                            </Pressable>
                        ) : null}

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            <Pressable onPress={() => onToggle?.(item)} style={GlobalStyles.button}>
                                <Text style={GlobalStyles.buttonText}>
                                    {finished ? "Mark Unfinished" : "Mark Finished"}
                                </Text>
                            </Pressable>

                            <Pressable onPress={() => onDelete?.(item)} style={GlobalStyles.button}>
                                <Text style={GlobalStyles.buttonText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

export default ReadingListItemCard;
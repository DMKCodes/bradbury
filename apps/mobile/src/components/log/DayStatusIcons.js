import React from "react";
import { Text, View } from "react-native";

const DayStatusIcons = ({ essayDone, storyDone, poemDone, colors }) => {
    const OK = colors?.ok ?? "#2ECC71";
    const OK_BG = colors?.okBg ?? "rgba(46, 204, 113, 0.12)";
    const MUTED = colors?.mutedText ?? "#A0A0A0";
    const BORDER = colors?.border ?? "rgba(255,255,255,0.12)";

    const items = [
        { letter: "E", done: !!essayDone },
        { letter: "S", done: !!storyDone },
        { letter: "P", done: !!poemDone },
    ];

    return (
        <View style={{ flexDirection: "row", gap: 10 }}>
            {items.map((it) => {
                const bg = it.done ? OK_BG : "transparent";
                const border = it.done ? OK : BORDER;
                const color = it.done ? OK : MUTED;

                return (
                    <View
                        key={it.letter}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: border,
                            backgroundColor: bg,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "900", color }}>{it.letter}</Text>
                    </View>
                );
            })}
        </View>
    );
};

export default DayStatusIcons;
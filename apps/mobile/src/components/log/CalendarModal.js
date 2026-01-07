import React, { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { clampToToday, dayKeyToUTCDate, getMonthGrid, getMonthName, utcDateToDayKey } from "../../lib/dateUtils";

const CalendarModal = ({
    visible,
    activeDayKey,
    todayKey,
    monthKey,
    onChangeMonthKey,
    getDayCompletionStatus,
    onSelectDayKey,
    onRequestClose,
    GlobalStyles,
    Colors,
}) => {
    const OK = Colors.ok ?? "#2ECC71";
    const OK_BG = Colors.okBg ?? "rgba(46, 204, 113, 0.12)";
    const PARTIAL = "#e6af2e";
    const PARTIAL_BG = "rgba(230, 175, 46, 0.16)";
    const MUTED = Colors.mutedText ?? "#A0A0A0";

    const calendar = useMemo(() => getMonthGrid(monthKey), [monthKey]);

    if (!visible) return null;

    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

    const goPrevMonth = () => {
        const dt = dayKeyToUTCDate(monthKey);
        if (!dt) return;

        dt.setUTCMonth(dt.getUTCMonth() - 1);
        const newMonthKey = utcDateToDayKey(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1)));
        onChangeMonthKey?.(newMonthKey);
    };

    const goNextMonth = () => {
        const dt = dayKeyToUTCDate(monthKey);
        if (!dt) return;

        dt.setUTCMonth(dt.getUTCMonth() + 1);
        const newMonthKey = utcDateToDayKey(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1)));
        onChangeMonthKey?.(newMonthKey);
    };

    const selectDay = (dayKey) => {
        if (!dayKey) return;

        const clamped = clampToToday(dayKey, todayKey);
        onSelectDayKey?.(clamped);
        onRequestClose?.();
    };

    return (
        <Modal transparent animationType="fade" visible onRequestClose={onRequestClose}>
            <Pressable
                onPress={onRequestClose}
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    padding: 18,
                    justifyContent: "center",
                }}
            >
                <Pressable
                    onPress={() => {}}
                    style={{
                        borderRadius: 18,
                        padding: 14,
                        backgroundColor: Colors.surface,
                        borderWidth: 1,
                        borderColor: Colors.border,
                    }}
                >
                    <View style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        alignItems: "center" 
                    }}>
                        <Pressable onPress={goPrevMonth} style={{ padding: 10 }}>
                            <FontAwesome name="chevron-left" size={18} color={Colors.text} />
                        </Pressable>

                        <Text style={{ fontWeight: "900", fontSize: 16, color: Colors.text }}>
                            {getMonthName(calendar.monthIndex)} {calendar.year}
                        </Text>

                        <Pressable onPress={goNextMonth} style={{ padding: 10 }}>
                            <FontAwesome name="chevron-right" size={18} color={Colors.text} />
                        </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                        {weekdays.map((w, i) => (
                            <Text key={`wd_${i}_${w}`} style={{ width: 34, textAlign: "center", color: MUTED, fontWeight: "800" }}>
                                {w}
                            </Text>
                        ))}
                    </View>

                    <View style={{ marginTop: 10, gap: 10 }}>
                        {calendar.weeks.map((week, wi) => (
                            <View key={`w_${wi}`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                {week.map((dk, di) => {
                                    if (!dk) {
                                        return <View key={`c_${wi}_${di}`} style={{ width: 34, height: 34 }} />;
                                    }

                                    const selected = String(dk) === String(activeDayKey);
                                    const status = getDayCompletionStatus?.(dk) || "none";
                                    const full = status === "full";
                                    const partial = status === "partial";

                                    const bg = selected
                                        ? Colors.accent
                                        : full
                                            ? OK_BG
                                            : partial
                                                ? PARTIAL_BG
                                                : "transparent";

                                    const border = selected
                                        ? Colors.accent
                                        : full
                                            ? OK
                                            : partial
                                                ? PARTIAL
                                                : Colors.border;

                                    const color = selected
                                        ? Colors.text
                                        : full
                                            ? OK
                                            : partial
                                                ? PARTIAL
                                                : MUTED;

                                    const dayNum = Number.parseInt(String(dk).slice(8, 10), 10);

                                    return (
                                        <Pressable
                                            key={`c_${wi}_${di}`}
                                            onPress={() => selectDay(dk)}
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
                                            <Text style={{ fontWeight: "900", color }}>{dayNum}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <Pressable
                            onPress={() => {
                                onSelectDayKey?.(todayKey);
                                onRequestClose?.();
                            }}
                            style={[GlobalStyles.button, { borderColor: Colors.border }]}
                        >
                            <Text style={GlobalStyles.buttonText}>Today</Text>
                        </Pressable>

                        <Pressable onPress={onRequestClose} style={[GlobalStyles.button, { borderColor: Colors.border }]}>
                            <Text style={GlobalStyles.buttonText}>Close</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default CalendarModal;
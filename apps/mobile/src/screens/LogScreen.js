import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { deleteEntryForDayCategory, getTodayDayKeyNY, listEntries, upsertEntryForDayCategory } from "../lib/store";
import { addDays, clampToToday, dayKeyToPretty, monthKeyFromDayKey } from "../lib/dateUtils";
import { useDaySwipe } from "../hooks/useDaySwipe";

import CalendarModal from "../components/log/CalendarModal";
import DayNavRow from "../components/log/DayNavRow";
import LogActionCard from "../components/log/LogActionCard";
import LoggedReadingsRow from "../components/log/LoggedReadingsRow";
import LogHeaderCard from "../components/log/LogHeaderCard";
import LogReadingForm from "../components/log/LogReadingForm";

import { Colors, GlobalStyles } from "../theme/theme";

const CATEGORIES = ["essay", "story", "poem"];

const LogScreen = ({ route }) => {
    const todayKey = useMemo(() => getTodayDayKeyNY(), []);
    const [activeDayKey, setActiveDayKey] = useState(todayKey);

    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMonthKey, setCalendarMonthKey] = useState(monthKeyFromDayKey(todayKey));

    const [showForm, setShowForm] = useState(false);
    const [formInitial, setFormInitial] = useState({
        editingCategory: null,
        category: "essay",
        title: "",
        author: "",
        url: "",
        rating: 5,
        wordCount: "",
        tagsRaw: "",
        notes: "",
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const all = await listEntries({});
            setAllEntries(Array.isArray(all) ? all : []);
        } catch (err) {
            console.error(err);
            setAllEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useMemo(() => {
            return () => {
                loadAll();
            };
        }, [])
    );

    useEffect(() => {
        const incomingDayKey = route?.params?.dayKey;
        if (incomingDayKey) {
            const next = clampToToday(String(incomingDayKey), todayKey);
            setActiveDayKey(next);
            setCalendarMonthKey(monthKeyFromDayKey(next));
        }
    }, [route?.params?.dayKey, todayKey]);

    useEffect(() => {
        const incomingWordCount = route?.params?.prefillWordCount;
        const incomingCategory = route?.params?.prefillCategory;

        const hasPrefill = incomingWordCount !== undefined || incomingCategory !== undefined;

        if (!hasPrefill) return;

        setFormInitial((prev) => {
            const next = { ...prev, editingCategory: null };

            if (incomingCategory && CATEGORIES.includes(String(incomingCategory))) {
                next.category = String(incomingCategory);
            }

            if (incomingWordCount !== undefined && incomingWordCount !== null && String(incomingWordCount).trim() !== "") {
                next.wordCount = String(incomingWordCount);
            }

            return next;
        });

        setShowForm(true);
    }, [route?.params?.prefillWordCount, route?.params?.prefillCategory]);

    const dayEntries = useMemo(() => {
        return allEntries.filter((e) => String(e.dayKey) === String(activeDayKey));
    }, [allEntries, activeDayKey]);

    const entriesByCategory = useMemo(() => {
        const map = new Map();
        for (const c of CATEGORIES) {
            map.set(c, null);
        }

        for (const e of dayEntries) {
            if (map.has(e.category)) {
                map.set(e.category, e);
            }
        }

        return map;
    }, [dayEntries]);

    const completion = useMemo(() => {
        const essayDone = !!entriesByCategory.get("essay");
        const storyDone = !!entriesByCategory.get("story");
        const poemDone = !!entriesByCategory.get("poem");

        return {
            essayDone,
            storyDone,
            poemDone,
            allDone: essayDone && storyDone && poemDone,
        };
    }, [entriesByCategory]);

    const completionMap = useMemo(() => {
        const map = new Map();

        for (const e of allEntries) {
            const dk = String(e.dayKey || "");
            if (!dk) continue;

            if (!map.has(dk)) map.set(dk, new Set());
            const set = map.get(dk);

            if (CATEGORIES.includes(String(e.category))) {
                set.add(String(e.category));
            }
        }

        return map;
    }, [allEntries]);

    const getDayCompletionStatus = (dayKey) => {
        const set = completionMap.get(String(dayKey));
        if (!set) return "none";

        const hasEssay = set.has("essay");
        const hasStory = set.has("story");
        const hasPoem = set.has("poem");

        const count = (hasEssay ? 1 : 0) + (hasStory ? 1 : 0) + (hasPoem ? 1 : 0);

        if (count === 0) return "none";
        if (count === 3) return "full";
        return "partial";
    };

    const goPrevDay = () => {
        const next = addDays(activeDayKey, -1);
        setActiveDayKey(next);
        setShowForm(false);
        setCalendarMonthKey(monthKeyFromDayKey(next));
    };

    const goNextDay = () => {
        const candidate = addDays(activeDayKey, +1);
        const next = clampToToday(candidate, todayKey);
        setActiveDayKey(next);
        setShowForm(false);
        setCalendarMonthKey(monthKeyFromDayKey(next));
    };

    const goToday = () => {
        setActiveDayKey(todayKey);
        setShowForm(false);
        setCalendarMonthKey(monthKeyFromDayKey(todayKey));
    };

    const openCalendar = () => {
        setCalendarMonthKey(monthKeyFromDayKey(activeDayKey));
        setCalendarOpen(true);
    };

    const openNewForm = () => {
        setFormInitial({
            editingCategory: null,
            category: "essay",
            title: "",
            author: "",
            url: "",
            rating: 5,
            wordCount: "",
            tagsRaw: "",
            notes: "",
        });
        setShowForm(true);
    };

    const openEditForm = (categoryKey) => {
        const entry = entriesByCategory.get(categoryKey);
        if (!entry) return;

        setFormInitial({
            editingCategory: categoryKey,
            category: categoryKey,
            title: String(entry.title || ""),
            author: String(entry.author || ""),
            url: String(entry.url || ""),
            rating: Number.isFinite(entry.rating) ? entry.rating : 5,
            wordCount: entry.wordCount === null || entry.wordCount === undefined ? "" : String(entry.wordCount),
            tagsRaw: Array.isArray(entry.tags) ? entry.tags.join(", ") : "",
            notes: String(entry.notes || ""),
        });

        setShowForm(true);
    };

    const confirmDelete = (categoryKey) => {
        Alert.alert(
            "Delete reading?",
            "This will remove the logged entry for this category on this day.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteEntryForDayCategory({ dayKey: activeDayKey, category: categoryKey });
                            await loadAll();
                            setShowForm(false);
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Delete failed", "Unable to delete this entry.");
                        }
                    },
                },
            ]
        );
    };

    const saveFromForm = async (payload) => {
        try {
            const res = await Promise.race([
                upsertEntryForDayCategory(payload),
                new Promise((_, reject) => setTimeout(() => reject(new Error("upsert_timeout_5000ms")), 5000)),
            ]);

            console.log("[LogScreen] upsert returned", res);

            await Promise.race([
                loadAll(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("loadAll_timeout_5000ms")), 5000)),
            ]);

            setShowForm(false);
            return true;
        } catch (err) {
            Alert.alert("Save failed", String(err?.message || err));
            return false;
        }
    };

    const swipeHandlers = useDaySwipe({
        onSwipeLeft: goNextDay,
        onSwipeRight: goPrevDay,
    });

    const canGoNext = activeDayKey !== todayKey;

    return (
        <SafeAreaView style={GlobalStyles.screen}>
            <View style={{ flex: 1 }} {...swipeHandlers}>
                <ScrollView contentContainerStyle={GlobalStyles.content}>
                    <LogHeaderCard
                        subtitle={dayKeyToPretty(activeDayKey)}
                        essayDone={completion.essayDone}
                        storyDone={completion.storyDone}
                        poemDone={completion.poemDone}
                        onOpenCalendar={openCalendar}
                        GlobalStyles={GlobalStyles}
                        Colors={Colors}
                    />

                    <View style={GlobalStyles.card}>
                        <DayNavRow
                            canGoNext={canGoNext}
                            activeIsToday={activeDayKey === todayKey}
                            onPrev={goPrevDay}
                            onToday={goToday}
                            onNext={goNextDay}
                            Colors={Colors}
                        />

                        {loading ? (
                            <View style={{ marginTop: 10 }} />
                        ) : null}
                    </View>

                    {!showForm ? (
                        <LogActionCard
                            activeDayKey={activeDayKey}
                            onPress={openNewForm}
                            GlobalStyles={GlobalStyles}
                            Colors={Colors}
                        />
                    ) : null}

                    {showForm ? (
                        <LogReadingForm
                            visible={showForm}
                            activeDayKey={activeDayKey}
                            initial={formInitial}
                            onSave={saveFromForm}
                            onClose={() => setShowForm(false)}
                            GlobalStyles={GlobalStyles}
                            Colors={Colors}
                        />
                    ) : null}

                    <LoggedReadingsRow
                        entriesByCategory={entriesByCategory}
                        onEdit={openEditForm}
                        onDelete={confirmDelete}
                        GlobalStyles={GlobalStyles}
                        Colors={Colors}
                    />
                </ScrollView>

                <CalendarModal
                    visible={calendarOpen}
                    activeDayKey={activeDayKey}
                    todayKey={todayKey}
                    monthKey={calendarMonthKey}
                    onChangeMonthKey={setCalendarMonthKey}
                    getDayCompletionStatus={getDayCompletionStatus}
                    onSelectDayKey={(dk) => {
                        setActiveDayKey(dk);
                        setShowForm(false);
                    }}
                    onRequestClose={() => setCalendarOpen(false)}
                    GlobalStyles={GlobalStyles}
                    Colors={Colors}
                />
            </View>
        </SafeAreaView>
    );
};

export default LogScreen;
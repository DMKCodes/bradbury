import { StyleSheet } from "react-native";

const Colors = {
    bg: "#242423",
    surface: "#333533",
    surface2: "#1b1b1d",
    border: "#cfdbd5",
    text: "#F5F2EA",
    mutedText: "#B9B1A4",
    accent: "#e6af2e",
    accent2: "#14B8A6",
    success: "#22C55E",
    danger: "#EF4444",

    overlay: "rgba(0, 0, 0, 0.45)",
    successTint: "rgba(34, 197, 94, 0.14)",
    dangerTint: "rgba(239, 68, 68, 0.14)",
};

const Spacing = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
};

const Radii = {
    sm: 8,
    md: 10,
    pill: 999,
};

const Typography = {
    h1: 22,
    h2: 18,
    body: 14,
};

const GlobalStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    title: {
        fontSize: Typography.h1,
        fontWeight: "600",
        color: Colors.text,
    },
    subtitle: {
        color: Colors.mutedText,
    },
    card: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    cardSuccess: {
        borderWidth: 1,
        borderColor: Colors.success,
        backgroundColor: Colors.successTint,
        borderRadius: Radii.md,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    label: {
        fontWeight: "800",
        color: Colors.text,
    },
    text: {
        color: Colors.text,
    },
    muted: {
        color: Colors.mutedText,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface2,
        borderRadius: Radii.sm,
        padding: 10,
        color: Colors.text,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface2,
        borderRadius: Radii.sm,
        alignSelf: "flex-start",
    },
    buttonText: {
        fontWeight: "800",
        color: Colors.text,
    },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.pill,
        backgroundColor: "transparent",
    },
    pillSelected: {
        backgroundColor: Colors.surface2,
    },
    pillSuccess: {
        borderColor: Colors.success,
        backgroundColor: Colors.successTint,
    },
    dividerRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
});

export { Colors, Spacing, Radii, Typography, GlobalStyles };
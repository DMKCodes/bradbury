export const CATEGORY_OPTIONS = [
    { key: "essay", label: "Essay" },
    { key: "story", label: "Short Story" },
    { key: "poem", label: "Poem" },
];

export const categoryLabel = (key) => {
    const hit = CATEGORY_OPTIONS.find((x) => x.key === key);
    return hit ? hit.label : String(key || "");
};
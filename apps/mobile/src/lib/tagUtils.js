const normalizeTagsInput = (raw) => {
    const parts = String(raw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const out = [];
    const seen = new Set();

    for (const p of parts) {
        const k = p.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(p);
    }

    return out;
};

export { normalizeTagsInput };
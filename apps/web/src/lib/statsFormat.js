const formatAvg = (n) => {
    if (n == null) return "—";
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toFixed(2);
};

const formatAvgWords = (n) => {
    if (n == null) return "—";
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return Math.round(num).toLocaleString();
};

const formatInt = (n) => {
    if (n == null) return "0";
    const num = Number(n);
    if (!Number.isFinite(num)) return "0";
    return Math.round(num).toLocaleString();
};

export {
    formatAvg,
    formatAvgWords,
    formatInt,
};
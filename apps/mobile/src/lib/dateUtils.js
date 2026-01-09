const dayKeyToUTCDate = (dayKey) => {
    const [y, m, d] = String(dayKey).split("-").map((x) => Number.parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

const utcDateToDayKey = (dt) => {
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const addDays = (dayKey, deltaDays) => {
    const dt = dayKeyToUTCDate(dayKey);
    if (!dt) return dayKey;

    dt.setUTCDate(dt.getUTCDate() + deltaDays);
    return utcDateToDayKey(dt);
};

const dayKeyToPretty = (dayKey) => {
    const [y, m, d] = String(dayKey).split("-").map((x) => Number.parseInt(x, 10));
    if (!y || !m || !d) return dayKey;

    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    return dt.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
    });
};

const isDayKeyInFuture = (dayKey, todayKey) => {
    return String(dayKey) > String(todayKey);
};

const clampToToday = (candidateDayKey, todayKey) => {
    if (isDayKeyInFuture(candidateDayKey, todayKey)) return todayKey;
    return candidateDayKey;
};

const monthKeyFromDayKey = (dayKey) => {
    const [y, m] = String(dayKey).split("-");
    if (!y || !m) return dayKey;
    return `${y}-${m}-01`;
};

const getMonthGrid = (monthKey) => {
    const dt = dayKeyToUTCDate(monthKey);
    if (!dt) return { year: "", monthIndex: 0, weeks: [] };

    const year = dt.getUTCFullYear();
    const monthIndex = dt.getUTCMonth();

    const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
    const firstWeekday = firstOfMonth.getUTCDay(); 

    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    const cells = [];

    for (let i = 0; i < firstWeekday; i += 1) {
        cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
        const day = new Date(Date.UTC(year, monthIndex, d));
        cells.push(utcDateToDayKey(day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    return { year, monthIndex, weeks };
};

const getMonthName = (monthIndex) => {
    const names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    return names[monthIndex] || "Month";
};

export {
    dayKeyToUTCDate,
    utcDateToDayKey,
    addDays,
    dayKeyToPretty,
    isDayKeyInFuture,
    clampToToday,
    monthKeyFromDayKey,
    getMonthGrid,
    getMonthName,
};
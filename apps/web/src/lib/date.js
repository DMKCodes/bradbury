const pad2 = (n) => String(n).padStart(2, "0");

const getTodayDayKeyLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
};

export {
    getTodayDayKeyLocal,
};
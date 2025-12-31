import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bradbury_books_v1";

const safeParse = (raw, fallback) => {
    try {
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const nowId = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const getTodayISODate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const normalizeTags = (userTags, year) => {
    const raw = Array.isArray(userTags) ? userTags : [];

    const cleaned = raw
        .map((t) => String(t || "").trim())
        .filter(Boolean)
        .filter((t) => !t.startsWith("year:") && !t.startsWith("type:"));

    const auto = [`year:${year}`, "type:book"];
    const merged = [...auto, ...cleaned];

    // De-dupe
    const seen = new Set();
    const out = [];
    for (const t of merged) {
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(t);
    }

    return out;
};

const loadBooks = async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const data = safeParse(raw, { books: [] });

    if (!data || !Array.isArray(data.books)) {
        return { books: [] };
    }

    return data;
};

const saveBooks = async (data) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
};

const listBooks = async ({ year } = {}) => {
    const data = await loadBooks();
    const books = Array.isArray(data.books) ? data.books : [];

    const filtered = year ? books.filter((b) => String(b.year) === String(year)) : books;

    return [...filtered].sort((a, b) => {
        const ad = String(a.finishedDate || "");
        const bd = String(b.finishedDate || "");
        if (ad !== bd) return ad < bd ? 1 : -1;

        const ac = Number(a.createdAt || 0);
        const bc = Number(b.createdAt || 0);
        return ac < bc ? 1 : -1;
    });
};

const listBookYears = async () => {
    const data = await loadBooks();
    const books = Array.isArray(data.books) ? data.books : [];

    const years = new Set();
    for (const b of books) {
        const y = b?.year;
        if (y != null && String(y).trim() !== "") {
            years.add(String(y));
        }
    }

    return [...years].sort((a, b) => (a < b ? 1 : -1));
};

const addBook = async ({ title, author, rating, wordCount, tags, notes, finishedDate } = {}) => {
    const safeTitle = String(title || "").trim();
    if (!safeTitle) return { ok: false, error: "title_required" };

    const fd = String(finishedDate || getTodayISODate()).trim();
    const year = fd.slice(0, 4);

    const book = {
        id: nowId("b"),
        title: safeTitle,
        author: String(author || "").trim(),
        rating: Number.isFinite(Number(rating)) ? Number(rating) : 5,
        wordCount: wordCount == null || String(wordCount).trim() === "" ? null : Number(wordCount),
        tags: normalizeTags(tags, year),
        notes: String(notes || "").trim(),
        finishedDate: fd,
        year,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const data = await loadBooks();
    data.books = [book, ...(data.books || [])];

    await saveBooks(data);
    return { ok: true, book };
};

const updateBook = async (bookId, patch = {}) => {
    const data = await loadBooks();
    const books = Array.isArray(data.books) ? data.books : [];

    const idx = books.findIndex((b) => b.id === bookId);
    if (idx < 0) return { ok: false, error: "not_found" };

    const current = books[idx];
    const next = {
        ...current,
        ...patch,
        updatedAt: Date.now(),
    };

    if (next.finishedDate) {
        next.year = String(next.finishedDate).slice(0, 4);
    }

    const year = String(next.year || "").trim() || String(new Date().getFullYear());
    next.tags = normalizeTags(next.tags, year);

    data.books = [...books.slice(0, idx), next, ...books.slice(idx + 1)];
    await saveBooks(data);

    return { ok: true, book: next };
};

const deleteBook = async (bookId) => {
    const data = await loadBooks();
    data.books = (data.books || []).filter((b) => b.id !== bookId);
    await saveBooks(data);
    return { ok: true };
};

export {
    listBooks,
    listBookYears,
    addBook,
    updateBook,
    deleteBook,
};
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell.jsx";
import TopicItemForm from "../components/curriculum/TopicItemForm.jsx";
import TopicItemList from "../components/curriculum/TopicItemList.jsx";

import { getTopic, addTopicItem, toggleTopicItemFinished, deleteTopicItem } from "../lib/api.js";

const TopicDetailPage = () => {
    const { topicId } = useParams();

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [topic, setTopic] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await getTopic(topicId);
            setTopic(res?.topic || null);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to load topic.");
            setTopic(null);
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        load();
    }, [load]);

    const sortedItems = useMemo(() => {
        const raw = Array.isArray(topic?.items) ? topic.items : [];
        return [...raw].sort((a, b) => {
            const af = Boolean(a.finished);
            const bf = Boolean(b.finished);
            if (af !== bf) return af ? 1 : -1;

            const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bd - ad;
        });
    }, [topic]);

    const handleAdd = async (payload) => {
        setBusy(true);
        setError("");

        try {
            await addTopicItem(topicId, payload);
            await load();
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to add item.");
        } finally {
            setBusy(false);
        }
    };

    const handleToggle = async (itemId) => {
        setBusy(true);
        setError("");

        try {
            await toggleTopicItemFinished(topicId, itemId);
            await load();
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to toggle item.");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (itemId) => {
        setBusy(true);
        setError("");

        try {
            await deleteTopicItem(topicId, itemId);
            await load();
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to delete item.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppShell
            title={topic?.name || "Topic"}
            subtitle="Add items and mark them finished. Finished items sort to the bottom."
        >
            <div style={{ marginBottom: 10 }}>
                <Link to="/curriculum">← Back to Curriculum</Link>
            </div>

            {loading ? <div>Loading…</div> : null}
            {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}

            {!loading && !topic ? <div className="muted">Topic not found.</div> : null}

            {topic ? (
                <>
                    <TopicItemForm busy={busy} onAdd={handleAdd} />
                    <TopicItemList items={sortedItems} onToggle={handleToggle} onDelete={handleDelete} />
                </>
            ) : null}
        </AppShell>
    );
};

export default TopicDetailPage;
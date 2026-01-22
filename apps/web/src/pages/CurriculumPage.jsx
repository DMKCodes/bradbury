import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import CreateTopicForm from "../components/curriculum/CreateTopicForm.jsx";
import TopicList from "../components/curriculum/TopicList.jsx";
import { createTopic, listTopics } from "../lib/api.js";

const CurriculumPage = () => {
    const [topics, setTopics] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setBusy(true);
        setError("");

        try {
            const res = await listTopics();
            setTopics(Array.isArray(res?.topics) ? res.topics : []);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to load topics.");
            setTopics([]);
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (name) => {
        setBusy(true);
        setError("");

        try {
            await createTopic({ name });
            await load();
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to create topic.");
        } finally {
            setBusy(false);
        }
    };

  return (
        <AppShell
            title="Curriculum"
            subtitle="Create topics and add readings you want to work through over time."
        >
            <CreateTopicForm busy={busy} onCreate={handleCreate} />
            {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}
            {busy && topics.length === 0 ? <div>Loading…</div> : null}
            <TopicList topics={topics} />
        </AppShell>
  );
};

export default CurriculumPage;
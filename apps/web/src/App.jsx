import React from "react";

import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import EntriesPage from "./pages/EntriesPage.jsx";
import CurriculumPage from "./pages/CurriculumPage.jsx";
import TopicDetailPage from "./pages/TopicDetailPage.jsx";
import StatsPage from "./pages/StatsPage.jsx";

const getToken = () => {
    return localStorage.getItem("bradbury_token") || "";
};

const RequireAuth = ({ children }) => {
    const authed = Boolean(getToken());
    if (!authed) return <Navigate to="/login" replace />;
    return children;
};

const App = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <RequireAuth>
                        <Navigate to="/entries" replace />
                    </RequireAuth>
                }
            />

            <Route
                path="/home"
                element={
                    <RequireAuth>
                        <HomePage />
                    </RequireAuth>
                }
            />

            <Route
                path="/entries"
                element={
                    <RequireAuth>
                        <EntriesPage />
                    </RequireAuth>
                }
            />

            <Route
                path="/stats"
                element={
                    <RequireAuth>
                        <StatsPage />
                    </RequireAuth>
                }
            />

            <Route
                path="/curriculum"
                element={
                    <RequireAuth>
                        <CurriculumPage />
                    </RequireAuth>
                }
            />

            <Route
                path="/curriculum/topics/:topicId"
                element={
                    <RequireAuth>
                        <TopicDetailPage />
                    </RequireAuth>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
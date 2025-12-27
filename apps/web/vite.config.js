import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/auth": "http://localhost:5050",
            "/entries": "http://localhost:5050",
            "/stats": "http://localhost:5050",
        },
    },
});

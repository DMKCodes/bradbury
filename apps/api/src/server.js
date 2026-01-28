import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import prisma from "./lib/prisma.js";

import { authRouter } from "./routes/auth.js";
import { entriesRouter } from "./routes/entries.js";
import { topicsRouter } from "./routes/topics.js";
import { statsRouter } from "./routes/stats.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
    cors({
        origin: corsOrigin === "*" ? true : corsOrigin,
        credentials: true,
    })
);

// Attach prisma to requests
app.use((req, _res, next) => {
    req.prisma = prisma;
    next();
});

app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "bradbury-api", version: "v1" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/entries", entriesRouter);
app.use("/api/v1/topics", topicsRouter);
app.use("/api/v1/stats", statsRouter);

app.get("/db-check", async (req, res) => {
    try {
        await req.prisma.$queryRaw`SELECT 1`;
        return res.json({ ok: true, db: "connected" });
    } catch (err) {
        console.error("[API] db-check failed:", err);
        return res.status(500).json({ ok: false, error: "db_check_failed" });
    }
});

app.use((err, _req, res, next) => {
    const isJsonParseError =
        err &&
        err.type === "entity.parse.failed" &&
        err.statusCode === 400;

    if (isJsonParseError) {
        return res.status(400).json({ ok: false, error: "invalid_json" });
    }

    return next(err);
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    const isProd = process.env.NODE_ENV === "production";

    const status = Number(err?.statusCode || err?.status || 500);
    const safeStatus = Number.isFinite(status) ? status : 500;

    if (!isProd) {
        console.error("[API] Unhandled error:", err);
    } else {
        console.error("[API] Unhandled error:", err?.message || String(err));
    }

    return res.status(safeStatus).json({
        ok: false,
        error: "internal_error",
        ...(isProd ? null : { detail: err?.message || String(err) }),
    });
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
    console.log(`[API] Listening on http://localhost:${port}`);
});
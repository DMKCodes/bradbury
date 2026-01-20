import express from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signToken, authRequired } from "../lib/auth.js";

const authRouter = express.Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

authRouter.post("/register", async (req, res, next) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        const existing = await req.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ ok: false, error: "email_in_use" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await req.prisma.user.create({
            data: { email, passwordHash },
            select: { id: true, email: true, createdAt: true },
        });

        const token = signToken({ userId: user.id });

        return res.json({ ok: true, token, user });
    } catch (err) {
        return next(err);
    }
});

authRouter.post("/login", async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "invalid_input" });
        }

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        const user = await req.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ ok: false, error: "invalid_credentials" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ ok: false, error: "invalid_credentials" });
        }

        const token = signToken({ userId: user.id });

        return res.json({
            ok: true,
            token,
            user: { id: user.id, email: user.email, createdAt: user.createdAt },
        });
    } catch (err) {
        return next(err);
    }
});

authRouter.get("/me", authRequired, async (req, res, next) => {
    try {
        const user = await req.prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, createdAt: true },
        });

        if (!user) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        return res.json({ ok: true, user });
    } catch (err) {
        return next(err);
    }
});

export { authRouter };
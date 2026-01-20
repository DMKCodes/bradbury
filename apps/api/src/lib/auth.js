import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const s = String(process.env.JWT_SECRET || "").trim();
    if (!s) {
        throw new Error("JWT_SECRET is missing");
    }
    return s;
};

const signToken = ({ userId }) => {
    const secret = getJwtSecret();
    return jwt.sign(
        { sub: userId },
        secret,
        { expiresIn: "30d" }
    );
};

const authRequired = (req, res, next) => {
    try {
        const header = String(req.headers.authorization || "");
        const parts = header.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ ok: false, error: "missing_token" });
        }

        const token = parts[1];
        const secret = getJwtSecret();
        const payload = jwt.verify(token, secret);

        req.userId = String(payload.sub);
        return next();
    } catch (_err) {
        return res.status(401).json({ ok: false, error: "invalid_token" });
    }
};

export {
    signToken,
    authRequired,
};
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] Missing JWT_SECRET in environment (.env).");
  process.exit(1);
}

function parseBearerToken(headerValue) {
  if (!headerValue) return null;
  const [scheme, token] = String(headerValue).split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ ok: false, error: "missing_bearer_token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // We issued tokens with { sub: userId, displayName }
    req.user = {
      userId: payload.sub,
      displayName: payload.displayName,
    };

    return next();
  } catch (_err) {
    return res.status(401).json({ ok: false, error: "invalid_or_expired_token" });
  }
}

module.exports = { requireAuth };
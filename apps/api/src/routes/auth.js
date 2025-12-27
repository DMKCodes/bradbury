// Auth routes:
// - POST /auth/login -> issue JWT
// - GET  /auth/me -> validate JWT and return user

const express = require("express");
const jwt = require("jsonwebtoken");
const { findUserByUsername } = require("../config/users");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] Missing JWT_SECRET in environment (.env).");
  process.exit(1);
}

function safeUserPayload(user) {
  return {
    userId: user.userId,
    displayName: user.displayName,
  };
}

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, error: "username_and_password_required" });
  }

  const user = findUserByUsername(username);
  const providedPassword = String(password);

  if (!user || user.password !== providedPassword) {
    return res.status(401).json({ ok: false, error: "invalid_credentials" });
  }

  const token = jwt.sign(
    { sub: user.userId, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return res.json({
    ok: true,
    token,
    user: safeUserPayload(user),
  });
});

// Token validation + session restore
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;
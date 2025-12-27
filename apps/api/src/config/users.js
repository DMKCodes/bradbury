function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

const USERS = [
  {
    userId: "doug",
    displayName: "Doug",
    username: normalizeUsername(process.env.USER1_USERNAME || "doug"),
    password: String(process.env.USER1_PASSWORD || "changeme"),
  },
  {
    userId: "caroline",
    displayName: "Caroline",
    username: normalizeUsername(process.env.USER2_USERNAME || "caroline"),
    password: String(process.env.USER2_PASSWORD || "changeme"),
  },
];

function findUserByUsername(username) {
  const u = normalizeUsername(username);
  return USERS.find((x) => x.username === u) || null;
}

module.exports = {
  USERS,
  findUserByUsername,
};
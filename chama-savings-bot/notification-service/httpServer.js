const express = require("express");
const { query } = require("./config/db");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "notifications" });
});

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.get("/delivery/:attemptId", async (req, res) => {
  const { rows } = await query(
    "SELECT id, user_id, channel, status, error, created_at FROM notification_attempts WHERE id = $1",
    [req.params.attemptId]
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

app.get("/users/:userId/recent", async (req, res) => {
  const { rows } = await query(
    `SELECT id, channel, status, created_at
     FROM notification_attempts
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.params.userId]
  );
  res.json(rows);
});

const port = process.env.NOTIFICATION_SERVICE_PORT || 5010;
app.listen(port, () => console.log(`[notifications] HTTP server on :${port}`));

module.exports = app;
const express = require("express");
const { query } = require("./config/db");
const IORedis = require("ioredis");

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
  const checks = {};

  const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.connect();
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "fail";
  } finally {
    redis.disconnect();
  }

  try {
    await query("SELECT 1");
    checks.postgres = "ok";
  } catch {
    checks.postgres = "fail";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  res.status(allOk ? 200 : 503).json({ service: "notifications", checks });
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
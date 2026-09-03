const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "notifications" });
});

const port = process.env.NOTIFICATION_SERVICE_PORT || 5010;
app.listen(port, () => console.log(`[notifications] HTTP server on :${port}`));

module.exports = app;
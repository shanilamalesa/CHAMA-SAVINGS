require("dotenv").config();

const express = require("express");
const path = require("path");
const next = require("next");

// Services
const telegramService = require("./services/telegram.service");
const botHandler = require("./bot/handler");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Telegram webhook (optional)
app.post("/webhook/telegram", (req, res) => {
  console.log("Webhook update received:", req.body);
  res.json({ ok: true });
});

// API routes
app.use("/api", require("./routes/api"));
app.use("/webhook/mpesa", require("./routes/mpesa"));

// Next.js
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

async function start() {
  try {
    console.log("🚀 Starting Chama Savings Bot...");

    // Prepare Next.js
    await nextApp.prepare();
    console.log("✓ Next.js ready");

    // Ensure bot token exists
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
    }

    // Initialize Telegram bot
    telegramService.initBot(token);
    console.log("✓ Telegram bot initialized");

    // Register handlers AFTER bot initialization
    botHandler.setupHandlers();

    // Next.js routes
    app.all("*", (req, res) => nextHandler(req, res));

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log("🤖 Telegram bot is polling...");
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

start();
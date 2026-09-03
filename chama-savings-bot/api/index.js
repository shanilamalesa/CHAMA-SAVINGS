require("dotenv").config();

const express = require("express");
const path = require("path");
const next = require("next");
const { startCronJobs } = require("./cron");

// Services
const telegramService = require("./services/telegram.service");
const botHandler = require("./bot/handler");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(require("./middleware/requestId"));


// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});


app.get("/debug/run-cycles", async (req, res) => {
  const { runJob } = require("./cron");
  const jobs = require("./cron/registry");
  const job = jobs.find(j => j.name === "chama-cycles");
  await runJob(job);
  res.json({ ok: true });
});

app.get("/debug/run-reminders", async (req, res) => {
  const { runJob } = require("./cron");
  const jobs = require("./cron/registry");
  const job = jobs.find(j => j.name === "chama-reminders");
  await runJob(job);
  res.json({ ok: true });
});

app.get("/debug/test-pdf", async (req, res) => {
  const { generateMonthlyPdf } = require("./cron/pdf/monthlyReport");
  const chamaId = -5335853740; // TestGroup2
  const cycleId = 2; // the already-closed cycle
  const filePath = await generateMonthlyPdf(chamaId, cycleId);

  const telegramService = require("./services/telegram.service");
  const bot = telegramService.getBot();
  await bot.sendDocument(8795295014, filePath, {}, { // Shanila's user_id, as a stand-in
    filename: "test-report.pdf",
  });

  res.json({ ok: true, filePath });
});

// Telegram webhook (optional)
app.post("/webhook/telegram", express.json(), (req, res) => {
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

    startCronJobs();
    console.log("✓ Cron jobs started");

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
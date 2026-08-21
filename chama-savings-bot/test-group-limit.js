// test-group-limit.js
const { Queue } = require("bullmq");
const connection = { host: "127.0.0.1", port: 6379 };
const q = new Queue("notifications", { connection });

(async () => {
  for (let i = 1; i <= 12; i++) {
    await q.add(
      "telegramSend",
      { chatId: "-100999", text: `msg ${i}` },
      { attempts: 5, backoff: { type: "fixed", delay: 8000 } }
    );
  }
  console.log("12 jobs queued for one chat");
  await q.close();
  process.exit(0);
})();
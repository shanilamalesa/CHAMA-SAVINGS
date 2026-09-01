// test-shutdown.js
const { Queue } = require("bullmq");
const connection = { host: "127.0.0.1", port: 6379 };
const q = new Queue("notifications", { connection });

(async () => {
  await q.add("slowJob", { note: "interrupt me" }, { attempts: 1 });
  console.log("queued 1 slow job");
  await q.close();
  process.exit(0);
})();
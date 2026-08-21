// test-dead-letter.js  — same folder as your other test scripts
const { Queue } = require("bullmq");
const connection = { host: "127.0.0.1", port: 6379 };
const q = new Queue("notifications", { connection });

(async () => {
  await q.add(
    "alwaysFails",
    { note: "this job can never succeed" },
    { attempts: 3, backoff: { type: "fixed", delay: 2000 } }
  );
  console.log("queued 1 doomed job");
  await q.close();
  process.exit(0);
})();
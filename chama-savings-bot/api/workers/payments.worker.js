// workers/payments.worker.js
const { Worker } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const worker = new Worker("payments", async (job) => {
  console.log(`[payments] Processing job ${job.id}: ${job.name}`, job.data);
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[payments] Done: ${job.name}`);
}, { connection });

worker.on("completed", (job) => console.log(`✓ [payments] Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`✗ [payments] Job ${job.id} failed:`, err.message));

console.log("Payments worker running");
// // workers/reports.worker.js
// const { Worker } = require("bullmq");

// const connection = {
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT || "6379", 10),
// };

// const worker = new Worker("reports", async (job) => {
//   console.log(`[reports] Processing job ${job.id}: ${job.name}`, job.data);
//   await new Promise((r) => setTimeout(r, 300));
//   console.log(`[reports] Done: ${job.name}`);
// }, { connection });

// worker.on("completed", (job) => console.log(`✓ [reports] Job ${job.id} completed`));
// worker.on("failed", (job, err) => console.error(`✗ [reports] Job ${job.id} failed:`, err.message));

// console.log("Reports worker running");


// workers/reports.worker.js
const { Worker } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const worker = new Worker("reports", async (job) => {
  console.log(`[reports] Processing job ${job.id}: ${job.name}`, job.data);

  if (job.name === "generateBulkReport") {
    const total = 10;
    for (let i = 1; i <= total; i++) {
      await new Promise((r) => setTimeout(r, 300)); // simulate work
      const percent = Math.round((i / total) * 100);
      await job.updateProgress(percent);
      console.log(`[reports] Progress: ${percent}%`);
    }
    console.log("[reports] Bulk report generation complete");
    return;
  }

  // Existing job type stays working
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[reports] Done: ${job.name}`);
}, { connection });

worker.on("completed", (job) => console.log(`✓ [reports] Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`✗ [reports] Job ${job.id} failed:`, err.message));
worker.on("progress", (job, progress) => {
  console.log(`[reports] Job ${job.id} reported progress: ${progress}%`);
});

console.log("Reports worker running");



// workers/notifications.worker.js
const { Worker, UnrecoverableError, DelayedError } = require("bullmq");
const { deadLetterQueue } = require("../queues");
const { checkGroupRateLimit, getWindowTtl, releaseSlot } = require("../services/rateLimit");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const worker = new Worker("notifications", async (job, token) => {
  console.log(`[${new Date().toISOString()}] processing ${job.id}`);
  console.log(`Processing job ${job.id} of type ${job.name} (priority ${job.opts.priority || "normal"})`);
  console.log("Job data:", job.data);

  if (job.name === "test") {
  console.log(`  test job ${job.data.n} — no-op`);
  return { ok: true };
}

  if (job.name === "telegramSend") {
    const allowed = await checkGroupRateLimit(job.data.chatId);

    if (!allowed) {
      await releaseSlot(job.data.chatId);
      const ttl = await getWindowTtl(job.data.chatId);
      console.log(` chat ${job.data.chatId} full - job ${job.id} delayed ${ttl}s`);
      // throw new Error("Group rate limited");

      await job.moveToDelayed(Date.now() + ttl * 1000 + 500, token);
      throw new DelayedError();
    }
    console.log(` ->(Simulated) telegram to ${job.data.chatId}: ${job.data.text}`);
    return { ok: true};
  }

  if (job.name !== "sendWhatsApp") {
    throw new Error(`Unknown job name: ${job.name}`);
  }

  if (!job.data.to || job.data.to.length < 8) {
    // Permanent: no amount of retrying fixes a bad phone number
    const reason = `Invalid phone number "${job.data.to}"`;

    await deadLetterQueue.add("permanentFailure", {
      originalQueue: "notifications",
      jobName: job.name,
      data: job.data,
      reason,
      failedAt: new Date().toISOString(),
    });

    // UnrecoverableError tells BullMQ: stop retrying immediately.
    throw new UnrecoverableError(`Permanent failure: ${reason}`);
  }

  await new Promise((r) => setTimeout(r, 500));
  console.log(`(Simulated) Sending WhatsApp to ${job.data.to}: "${job.data.message}"`);
}, { connection,
      limiter: {
        max: 5, //deliberately low
        duration: 1000,
      },
      concurrency: 1 });

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  console.error(`✗ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message);

  const maxAttempts = job.opts.attempts ?? 1;

  if (job.attemptsMade >= maxAttempts) {
    console.error(`  ☠ Job ${job.id} exhausted retries — moving to dead-letter`);

    await deadLetterQueue.add("exhaustedRetries", {
      originalQueue: "notifications",
      originalJobId: job.id,
      jobName: job.name,
      data: job.data,
      error: err.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });
  }
});

console.log("Notifications worker running (concurrency: 1)");
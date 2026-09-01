// workers/notifications.worker.js
const { Worker, UnrecoverableError, DelayedError } = require("bullmq");
const { deadLetterQueue } = require("../queues");
const {
  checkGroupRateLimit,
  getWindowTtl,
  releaseSlot,
} = require("../services/rateLimit");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// ---------------------------------------------------------------------------
// Handler: decides HOW to do the work, and whether a failure is worth retrying.
// It does NOT decide what happens to dead jobs — that is the listener's job.
// ---------------------------------------------------------------------------
const worker = new Worker(
  "notifications",
  async (job, token) => {
    console.log(`[${new Date().toISOString()}] processing ${job.id}`);
    console.log(
      `Processing job ${job.id} of type ${job.name} (priority ${job.opts.priority || "normal"})`
    );
    console.log("Job data:", job.data);

    if (job.name === "slowJob") {
      console.log(`  slow job starting — will take 8 seconds`);
      await new Promise((r) => setTimeout(r, 8000));
      console.log(`  slow job finished`);
      return { ok: true };
    }

    // --- no-op job type, used for exercising queue mechanics ---------------
    if (job.name === "test") {
      console.log(`  test job ${job.data.n} — no-op`);
      return { ok: true };
    }

    // --- telegram, with a per-chat rate limit ------------------------------
    if (job.name === "telegramSend") {
      const allowed = await checkGroupRateLimit(job.data.chatId);

      if (!allowed) {
        await releaseSlot(job.data.chatId); // we didn't send; give the slot back
        const ttl = await getWindowTtl(job.data.chatId);
        console.log(
          `  ⏸ chat ${job.data.chatId} full — job ${job.id} delayed ${ttl}s`
        );

        // Reschedule without burning a retry attempt.
        await job.moveToDelayed(Date.now() + ttl * 1000 + 500, token);
        throw new DelayedError();
      }

      console.log(
        `  → (simulated) telegram to ${job.data.chatId}: ${job.data.text}`
      );
      return { ok: true };
    }

    // --- anything we don't recognise --------------------------------------
    if (job.name !== "sendWhatsApp") {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    // --- whatsapp ----------------------------------------------------------
    // Permanent: no amount of retrying fixes a malformed number.
    if (!job.data.to || job.data.to.length < 8) {
      throw new UnrecoverableError(`Invalid phone number "${job.data.to}"`);
    }

    await new Promise((r) => setTimeout(r, 500));
    console.log(
      `  (Simulated) Sending WhatsApp to ${job.data.to}: "${job.data.message}"`
    );
    return { ok: true };
  },
  {
    connection,
    limiter: {
      max: 5, // deliberately low so the pacing is visible
      duration: 1000,
    },
    concurrency: 1,
    stalledInterval: 10000,  // sweep for abandoned jobs every 10s
    maxStalledCount: 3,      // after 3 stalls, give up on the job

  }
);

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

// ---------------------------------------------------------------------------
// Listener: the only place that knows a failure was FINAL. Catches both doors
// into the dead-letter queue — exhausted retries and UnrecoverableError.
// ---------------------------------------------------------------------------
worker.on("failed", async (job, err) => {
  console.error(
    `✗ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`,
    err.message
  );

  const maxAttempts = job.opts.attempts ?? 1;
  const isPermanent = err instanceof UnrecoverableError;

  if (isPermanent || job.attemptsMade >= maxAttempts) {
    console.error(`  ☠ Job ${job.id} is dead — moving to dead-letter`);

    // Persist first: this record is the source of truth.
    await deadLetterQueue.add("deadJob", {
      originalQueue: "notifications",
      originalJobId: job.id,
      jobName: job.name,
      data: job.data,
      error: err.message,
      permanent: isPermanent,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });

    // Notify second: best-effort, must never crash the worker.
    try {
      console.log(
        `  📱 ALERT to ${process.env.ADMIN_PHONE || "<no ADMIN_PHONE set>"}: Dead job ${job.name} (id ${job.id}) — ${err.message}`
      );
    } catch (alertErr) {
      console.error("  Failed to send dead-letter alert:", alertErr.message);
    }
  }
});

let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) {
    console.log("  Already shutting down — press Ctrl+C again to force.");
    return;
  }
  shuttingDown = true;

  console.log(`\n${signal} received. Draining in-flight jobs...`);
  const started = Date.now();

  await Promise.race([
    worker.close(),
    new Promise((r) => setTimeout(r, 30000)), // hard cap
  ]);

  console.log(`Worker shut down cleanly after ${Date.now() - started}ms`);
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

console.log("Notifications worker running (concurrency: 1)");
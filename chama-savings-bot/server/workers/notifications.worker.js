

// // server/workers/notifications.worker.js
// const { Worker } = require("bullmq");

// const connection = {
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT || "6379", 10),
// };

// const worker = new Worker("notifications", async (job) => {
//   console.log(`Processing job ${job.id} of type ${job.name} (priority ${job.opts.priority || "normal"})`);
//   console.log("Job data:", job.data);

// //   if (job.name === "sendWhatsApp") {
// //     // Simulated permanent failure: a phone number that's obviously invalid
// //     if (!job.data.to || job.data.to.length < 8) {
// //       throw new Error(`Permanent failure: invalid phone number "${job.data.to}"`);
// //     }
// //     console.log(`(Simulated) Sending WhatsApp to ${job.data.to}: "${job.data.message}"`);
// //   } else {
// //     throw new Error(`Unknown job name: ${job.name}`);
// //   }
// // }, { connection, concurrency: 5 });

// if (job.name === "sendWhatsApp") {
//     if (!job.data.to || job.data.to.length < 8) {
//       throw new Error(`Permanent failure: invalid phone number "${job.data.to}"`);
//     }
//     await new Promise((r) => setTimeout(r, 500)); // simulate network delay
//     console.log(`(Simulated) Sending WhatsApp to ${job.data.to}: "${job.data.message}"`);
//   }else {
//        throw new Error(`Unknown job name: ${job.name}`);
//      }
//     }, { connection, concurrency: 1 });
 

// worker.on("completed", (job) => {
//   console.log(`✓ Job ${job.id} completed`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`✗ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message);
// });

// console.log("Notifications worker running (concurrency: 1)");





// workers/notifications.worker.js
const { Worker, UnrecoverableError } = require("bullmq");
const { deadLetterQueue } = require("../queues");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const worker = new Worker("notifications", async (job) => {
  console.log(`Processing job ${job.id} of type ${job.name} (priority ${job.opts.priority || "normal"})`);
  console.log("Job data:", job.data);

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
}, { connection, concurrency: 1 });

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`✗ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message);
});

console.log("Notifications worker running (concurrency: 1)");

const { notificationsQueue } = require("./index");
const { jobs: jobsContracts } = require("@mctaba/contracts");
const crypto = require("crypto");

async function enqueue(name, payload, opts = {}) {
  jobsContracts.validateJob(name, payload);
  return notificationsQueue.add(name, payload, opts);
}

async function run() {
  const requestId = crypto.randomUUID();
  console.log(`[api][${requestId}] enqueueing test batch`);
  console.log("[Job Queued] Marketing Blast (Priority 10)");
  await enqueue("sendWhatsApp",
    { to: "+254700000001", message: "50% off everything!", requestId },
    { priority: 10 });

  console.log("[Job Queued] Payment Receipt (Priority 1)");
  await enqueue("sendWhatsApp",
    { to: "+254700000002", message: "Your payment was received.", requestId },
    { priority: 1 });

  console.log("[Job Delayed] Follow-up reminder scheduled for 10s from now...");
  await enqueue("sendWhatsApp",
    { to: "+254700000003", message: "Don't forget to contribute this month!", requestId },
    { delay: 10000 });

  console.log("[Job Queued] Invalid number (will fail permanently)");
  await enqueue("sendWhatsApp", { to: "123", message: "This will fail", requestId });

  process.exit(0);
}

run();
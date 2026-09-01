// queues/testPriority.js
const { notificationsQueue } = require("./index");

async function run() {
  console.log("[Job Queued] Marketing Blast (Priority 10)");
  await notificationsQueue.add(
    "sendWhatsApp",
    { to: "+254700000001", message: "50% off everything!" },
    { priority: 10 }
  );

  console.log("[Job Queued] Payment Receipt (Priority 1)");
  await notificationsQueue.add(
    "sendWhatsApp",
    { to: "+254700000002", message: "Your payment was received." },
    { priority: 1 }
  );

  process.exit(0);
}

run();
// queues/testFlow.js
const { FlowProducer } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const flow = new FlowProducer({ connection });

async function run() {
  console.log("[Flow] Adding parent job: confirm-contribution, with 2 children");

  await flow.add({
    name: "confirm-contribution",
    queueName: "payments",
    data: { memberName: "Shanila", amount: 500 },
    children: [
      {
        name: "sendWhatsApp",
        queueName: "notifications",
        data: { to: "+254791323412", message: "Your contribution of KSh 500 was confirmed." },
        opts: { priority: 1 },
      },
      {
        name: "updateStats",
        queueName: "reports",
        data: { chamaId: -5335853740 },
      },
    ],
  });

  console.log("[Flow] Added. Children will run first, then the parent.");
  process.exit(0);
}

run();
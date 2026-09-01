// server/workers/whatsapp.worker.js
const { Worker } = require("bullmq");
const whatsapp = require("../services/whatsapp.service");

const worker = new Worker("whatsapp", async (job) => {
  const { to, text, templateName, components } = job.data;

  if (templateName) {
    await whatsapp.sendTemplateMessage({ to, templateName, components });
  } else {
    await whatsapp.sendTextMessage({ to, text });
  }
}, {
  connection,
  concurrency: 10,
  limiter: { max: 20, duration: 1000 },//can not exacute more than 20 jobs in 1000sec
});

worker.on("completed", (job) => console.log(`[whatsapp] Job ${job.id} done`));
worker.on("failed", (job, err) => console.error(`[whatsapp] Job ${job.id} failed: ${err.message}`));

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

module.exports = worker;
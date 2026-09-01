// server/queues/index.js
const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};


// server/queues/index.js (extended)
const whatsappQueue = new Queue("whatsapp", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

const telegramQueue = new Queue("telegram", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 1000, //tells redis to automatically cleans the remaining job to save the memory stirage
    removeOnFail: 5000,
  },
});

const smsQueue = new Queue("sms", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

const notificationsQueue = new Queue("notifications", { connection, defaultJobOptions });
const paymentsQueue = new Queue("payments", { connection, defaultJobOptions });
const reportsQueue = new Queue("reports", { connection, defaultJobOptions });
const deadLetterQueue = new Queue("dead-letter", { connection });

module.exports = {
  notificationsQueue,
  paymentsQueue,
  reportsQueue,
  deadLetterQueue,
  whatsappQueue,
  telegramQueue,
  smsQueue
};
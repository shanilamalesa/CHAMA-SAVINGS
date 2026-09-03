const SendWhatsAppJob = {
  jobName: "sendWhatsApp",
  payload: { to: "string", message: "string" },
};

const TelegramSendJob = {
  jobName: "telegramSend",
  payload: { chatId: "number", text: "string" },
};

const TestJob = {
  jobName: "test",
  payload: { n: "number" },
};

const SlowJob = {
  jobName: "slowJob",
  payload: {},
};

function validateJob(jobName, payload) {
  const all = [SendWhatsAppJob, TelegramSendJob, TestJob, SlowJob];
  const job = all.find((j) => j.jobName === jobName);
  if (!job) throw new Error(`Unknown job: ${jobName}`);

  for (const [key, type] of Object.entries(job.payload)) {
    const optional = type.endsWith("?");
    const baseType = optional ? type.slice(0, -1) : type;

    if (payload[key] === undefined) {
      if (!optional) throw new Error(`Missing required field: ${key}`);
      continue;
    }
    if (baseType === "string" && typeof payload[key] !== "string")
      throw new Error(`Field ${key} must be a string`);
    if (baseType === "number" && typeof payload[key] !== "number")
      throw new Error(`Field ${key} must be a number`);
    if (baseType === "array" && !Array.isArray(payload[key]))
      throw new Error(`Field ${key} must be an array`);
  }
  return true;
}

module.exports = { SendWhatsAppJob, TelegramSendJob, TestJob, SlowJob, validateJob };
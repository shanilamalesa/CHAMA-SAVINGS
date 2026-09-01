// services/rateLimit.js
const IORedis = require("ioredis");
const client = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});

const GROUP_MAX = 5;        // small for testing; Telegram's real value is 20
const GROUP_WINDOW = 20;    // seconds; Telegram's real value is 60

async function checkGroupRateLimit(chatId) {
  const key = `rl:telegram:${chatId}`;
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, GROUP_WINDOW);
  }

  return count <= GROUP_MAX;
}

async function getWindowTtl(chatId) {
    const ttl = await client.ttl(`rl:telegram:${chatId}`);
    return ttl > 0 ? ttl : 1;    // -2 = no key, -1 = no expiry
}

async function releaseSlot(chatId) {
    await client.decr(`rl:telegram:${chatId}`);
}

module.exports = { checkGroupRateLimit, getWindowTtl, releaseSlot };
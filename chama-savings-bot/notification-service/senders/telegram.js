const axios = require("axios");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text, options = {}) {
  const res = await axios.post(`${BASE}/sendMessage`, {
    chat_id: chatId,
    text,
    ...options,
  });
  return res.data;
}

module.exports = { sendMessage };
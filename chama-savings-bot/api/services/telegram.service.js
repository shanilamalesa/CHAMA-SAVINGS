const TelegramBot = require('node-telegram-bot-api');

let bot;

function initBot(token) {
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN not set');
  }
  bot = new TelegramBot(token, { polling: true });
  return bot;
}

function getBot() {
  if (!bot) {
    throw new Error('Bot not initialized. Call initBot first.');
  }
  return bot;
}

// Helper to send message
async function sendMessage(chatId, text, options = {}) {
  const b = getBot();
  return b.sendMessage(chatId, text, options);
}

// Helper to send document
async function sendDocument(chatId, doc, options = {}, fileOptions = {}) {
  const b = getBot();
  return b.sendDocument(chatId, doc, fileOptions, options);
}

// Helper to edit message
async function editMessage(chatId, messageId, text, options = {}) {
  const b = getBot();
  return b.editMessageText(text, { chat_id: chatId, message_id: messageId, ...options });
}

// Session storage for multi-step flows (could use Redis)
const sessions = {};

async function getSession(userId) {
  return sessions[userId] || null;
}

async function setSession(userId, data) {
  sessions[userId] = data;
}

async function clearSession(userId) {
  delete sessions[userId];
}

module.exports = {
  initBot,
  getBot,
  sendMessage,
  sendDocument,
  editMessage,
  getSession,
  setSession,
  clearSession,
};

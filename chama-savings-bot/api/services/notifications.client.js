const BASE = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5010";
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

async function callWithTimeout(url, opts = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getRecentAttempts(userId) {
  const res = await callWithTimeout(`${BASE}/users/${userId}/recent`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Notification service returned ${res.status}`);
  return res.json();
}

module.exports = { getRecentAttempts };
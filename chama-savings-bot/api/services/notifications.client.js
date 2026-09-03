const BASE = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5010";
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

async function getRecentAttempts(userId) {
  const res = await fetch(`${BASE}/users/${userId}/recent`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Notification service returned ${res.status}`);
  return res.json();
}

module.exports = { getRecentAttempts };
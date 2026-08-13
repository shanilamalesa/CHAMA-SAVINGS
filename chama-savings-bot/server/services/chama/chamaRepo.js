const { query, pool } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// ============ CHAMA CRUD ============

async function createChama({ chatId, name, monthlyAmountCents, cycleDay, treasurerUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure chat exists
    await client.query(
      'INSERT INTO telegram_chats (id, type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [chatId, 'group']
    );

    // Create chama
    await client.query(
      `INSERT INTO chamas (chat_id, name, monthly_amount_cents, cycle_day, treasurer_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [chatId, name, monthlyAmountCents, cycleDay, treasurerUserId]
    );

    // Open first cycle
    const now = new Date();
    const periodStart = now.toISOString().slice(0, 10);
    const periodEnd = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    await client.query(
      `INSERT INTO cycles (chama_id, period_start, period_end, expected_total_cents, status)
       VALUES ($1, $2, $3, $4, 'open')`,
      [chatId, periodStart, periodEnd, monthlyAmountCents]
    );

    await client.query('COMMIT');
    return { chatId, name, monthlyAmountCents, cycleDay, treasurerUserId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findByChatId(chatId) {
  //a plain SQL query results taht coming directly from PostgresSQL through the pg library
  const { rows } = await query('SELECT * FROM chamas WHERE chat_id = $1', [chatId]);
  return rows[0];
}

// ============ MEMBERS ============

async function findMember(chamaId, userId) {
  const { rows } = await query(
    'SELECT * FROM chama_members WHERE chama_id = $1 AND user_id = $2',
    [chamaId, userId]
  );
  return rows[0];
}

async function addMember({ chamaId, userId, name, phone }) {
  await query(
    `INSERT INTO chama_members (chama_id, user_id, name, phone)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chama_id, user_id) DO UPDATE SET left_at = NULL`,
    [chamaId, userId, name, phone]
  );
}

async function getMemberCount(chamaId) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM chama_members WHERE chama_id = $1 AND left_at IS NULL',
    [chamaId]
  );
  return rows[0].count;
}

async function getMembers(chamaId) {
  const { rows } = await query(
    `SELECT user_id, name, phone, joined_at, left_at
     FROM chama_members WHERE chama_id = $1 AND left_at IS NULL
     ORDER BY joined_at`,
    [chamaId]
  );
  return rows;
}

// ============ CYCLES ============

async function getOpenCycle(chamaId) {
  const { rows } = await query(
    'SELECT * FROM cycles WHERE chama_id = $1 AND status = $2 LIMIT 1',
    [chamaId, 'open']
  );
  return rows[0];
}

async function getCycle(cycleId) {
  const { rows } = await query('SELECT * FROM cycles WHERE id = $1', [cycleId]);
  return rows[0];
}

async function createCycle({ chamaId, periodStart, periodEnd, expectedTotalCents }) {
  const { rows } = await query(
    `INSERT INTO cycles (chama_id, period_start, period_end, expected_total_cents, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [chamaId, periodStart, periodEnd, expectedTotalCents]
  );
  return rows[0];
}

async function closeCycle(cycleId) {
  await query('UPDATE cycles SET status = $1 WHERE id = $2', ['closed', cycleId]);
}

// ============ CONTRIBUTIONS ============

async function createContribution({ cycleId, chamaId, memberUserId, amountCents, status = 'pending' }) {
  const id = uuidv4();
  const { rows } = await query(
    `INSERT INTO contributions (id, cycle_id, chama_id, member_user_id, amount_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, cycleId, chamaId, memberUserId, amountCents, status]
  );
  return rows[0];
}

async function updateContribution(contributionId, updates) {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ');
  const values = [contributionId, ...Object.values(updates)];

  await query(
    `UPDATE contributions SET ${fields} WHERE id = $1`,
    values
  );
}

async function confirmContribution(contributionId) {
  const { rows } = await query(
    `UPDATE contributions SET status = $1, confirmed_at = NOW()
     WHERE id = $2 AND status = $3
     RETURNING id`,
    ['confirmed', contributionId, 'pending']
  );
  return rows.length > 0;
}

async function getMemberContributions(chamaId, userId, cycleId = null) {
  let sql = `
    SELECT c.* FROM contributions c
    WHERE c.chama_id = $1 AND c.member_user_id = $2 AND c.status = 'confirmed'
  `;
  let params = [chamaId, userId];

  if (cycleId) {
    sql += ' AND c.cycle_id = $3';
    params.push(cycleId);
  }

  const { rows } = await query(sql, params);
  return rows;
}

// ============ MEMBER BALANCE ============

async function getMemberBalance(chamaId, userId) {
  const member = await findMember(chamaId, userId);
  if (!member) return null;

  // Get open cycle
  const { rows: cycleRows } = await query(
    'SELECT id, expected_total_cents FROM cycles WHERE chama_id = $1 AND status = $2',
    [chamaId, 'open']
  );
  const cycle = cycleRows[0];

  // This cycle contribution
  let contributedThisCycle = 0;
  if (cycle) {
    const { rows: contribRows } = await query(
      `SELECT COALESCE(SUM(amount_cents), 0)::int AS total
       FROM contributions WHERE cycle_id = $1 AND member_user_id = $2 AND status = 'confirmed'`,
      [cycle.id, userId]
    );
    contributedThisCycle = contribRows[0].total;
  }

  // All-time contributions
  const { rows: totalRows } = await query(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS total
     FROM contributions WHERE chama_id = $1 AND member_user_id = $2 AND status = 'confirmed'`,
    [chamaId, userId]
  );
  const totalContributed = totalRows[0].total;

  // Outstanding fines
  const { rows: finesRows } = await query(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS total
     FROM fines WHERE member_user_id = $1 AND paid = false`,
    [userId]
  );
  const outstandingFines = finesRows[0].total;

  return {
    user_id: userId,
    name: member.name,
    phone: member.phone,
    contributedThisCycle,
    expected: cycle ? cycle.expected_total_cents : 0,
    totalContributed,
    outstandingFines,
  };
}

// ============ GROUP STATS ============

async function getGroupStats(chamaId) {
  const chama = await findByChatId(chamaId);
  const cycle = await getOpenCycle(chamaId);

  if (!cycle) {
    return {
      collectedThisCycle: 0,
      expectedThisCycle: 0,
      contributors: 0,
      totalMembers: 0,
      outstandingFines: 0,
      allTime: 0,
    };
  }

  // This cycle stats
  const { rows: cycleStats } = await query(
    `SELECT
      COUNT(DISTINCT CASE WHEN c.status = 'confirmed' THEN c.member_user_id END)::int AS contributors,
      COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'confirmed'), 0)::int AS collected
     FROM contributions c
     WHERE c.cycle_id = $1`,
    [cycle.id]
  );

  const cycleData = cycleStats[0];

  // All-time
  const { rows: allTimeStats } = await query(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS total
     FROM contributions WHERE chama_id = $1 AND status = 'confirmed'`,
    [chamaId]
  );

  // Outstanding fines
  const { rows: finesStats } = await query(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS total
     FROM fines WHERE cycle_id = $1 AND paid = false`,
    [cycle.id]
  );

  // Total members
  const totalMembers = await getMemberCount(chamaId);

  return {
    collectedThisCycle: cycleData.collected,
    expectedThisCycle: cycle.expected_total_cents,
    contributors: cycleData.contributors,
    totalMembers,
    outstandingFines: finesStats[0].total,
    allTime: allTimeStats[0].total,
  };
}

async function getMemberStatusList(chamaId) {
  const chama = await findByChatId(chamaId);
  const cycle = await getOpenCycle(chamaId);

  const { rows } = await query(
    `SELECT m.user_id, m.name,
            COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'confirmed'), 0)::int AS contributedThisCycle,
            $2::int AS expected
     FROM chama_members m
     LEFT JOIN contributions c ON c.member_user_id = m.user_id AND c.cycle_id = $1
     WHERE m.chama_id = $3 AND m.left_at IS NULL
     GROUP BY m.user_id, m.name
     ORDER BY m.joined_at`,
    [cycle?.id, chama.monthly_amount_cents, chamaId]
  );

  return rows;
}

// ============ FINES ============

async function createFine({ cycleId, memberUserId, amountCents, reason }) {
  const { rows } = await query(
    `INSERT INTO fines (cycle_id, member_user_id, amount_cents, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cycleId, memberUserId, amountCents, reason]
  );
  return rows[0];
}

async function markFinePaid(fineId) {
  await query('UPDATE fines SET paid = true WHERE id = $1', [fineId]);
}

// ============ ONBOARDING STATE ============

async function startMemberOnboarding(userId, chamaId) {
  await query(
    `INSERT INTO member_onboarding (user_id, chama_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET chama_id = $2`,
    [userId, chamaId]
  );
}

async function getMemberOnboarding(userId) {
  const { rows } = await query(
    'SELECT * FROM member_onboarding WHERE user_id = $1',
    [userId]
  );
  return rows[0];
}

async function completeMemberOnboarding(userId) {
  await query('DELETE FROM member_onboarding WHERE user_id = $1', [userId]);
}

// ============ OUTBOX ============

async function writeToOutbox({ eventType, payload }) {
  const { rows } = await query(
    `INSERT INTO outbox (event_type, payload)
     VALUES ($1, $2)
     RETURNING *`,
    [eventType, JSON.stringify(payload)]
  );
  return rows[0];
}

async function getUnprocessedOutbox(limit = 10) {
  const { rows } = await query(
    'SELECT * FROM outbox WHERE processed = false ORDER BY created_at ASC LIMIT $1',
    [limit]
  );
  return rows;
}

async function markOutboxProcessed(outboxId) {
  await query(
    'UPDATE outbox SET processed = true, processed_at = NOW() WHERE id = $1',
    [outboxId]
  );
}

module.exports = {
  createChama,
  findByChatId,
  findMember,
  addMember,
  getMemberCount,
  getMembers,
  getOpenCycle,
  getCycle,
  createCycle,
  closeCycle,
  createContribution,
  updateContribution,
  confirmContribution,
  getMemberContributions,
  getMemberBalance,
  getGroupStats,
  getMemberStatusList,
  createFine,
  markFinePaid,
  startMemberOnboarding,
  getMemberOnboarding,
  completeMemberOnboarding,
  writeToOutbox,
  getUnprocessedOutbox,
  markOutboxProcessed,
};

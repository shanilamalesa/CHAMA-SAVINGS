// server/cron/tasks/chamaCycles.js

const { query, pool } = require("../../config/db");
const chamaService = require("../../services/chama/chamaService");
const telegramService = require("../../services/telegram.service");
const { generateMonthlyPdf } = require("../pdf/monthlyReport");

async function processCycles() {
  const today = new Date();
  //getDate-> extracting the calender from day1-30
  const dayOfMonth = today.getDate();

  const { rows: chamas } = await query(
    "SELECT * FROM chamas WHERE cycle_day = $1",
    [dayOfMonth]
  );

  //
  for (const chama of chamas) {
    try {
        //heart of tranaction business logic
      await closeAndOpenCycle(chama);
    } catch (err) {
      console.error(`Cycle processing failed for ${chama.chat_id}:`, err);
    }
  }
}

async function closeAndOpenCycle(chama) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Find the current open cycle
    const { rows: cycleRows } = await client.query(
      "SELECT * FROM cycles WHERE chama_id = $1 AND status = 'open' FOR UPDATE",
      [chama.chat_id]
    );
    const currentCycle = cycleRows[0];
    //if not open cycle
    if (!currentCycle) {
      // First-ever cycle
      await client.query(
        `INSERT INTO cycles (chama_id, period_start, period_end, expected_total_cents)
         VALUES ($1, $2, $3, $4)`,
        [
          chama.chat_id,
          new Date().toISOString().slice(0, 10),
          new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          chama.monthly_amount_cents * (await getMemberCount(client, chama.chat_id)),
        ]
      );
      await client.query("COMMIT");
      return;
    }

    // 2. Close the current cycle
    await client.query(
      "UPDATE cycles SET status = 'closed' WHERE id = $1",
      [currentCycle.id]
    );

    // 3. Apply fines for everyone who is short
    const { rows: shortfalls } = await client.query(
      `SELECT m.user_id, m.name,
              COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'confirmed'), 0) AS contributed,
              $2 AS expected
       FROM chama_members m
       LEFT JOIN contributions c ON c.member_user_id = m.user_id AND c.cycle_id = $1
       WHERE m.chama_id = $3 AND m.left_at IS NULL
       GROUP BY m.user_id, m.name`,
      [currentCycle.id, chama.monthly_amount_cents, chama.chat_id]
    );

    for (const s of shortfalls) {
      const shortfall = parseInt(s.expected, 10) - parseInt(s.contributed, 10);
      if (shortfall <= 0) continue;
      const fine = Math.round(shortfall * (chama.fine_percent / 100));
      await client.query(
        `INSERT INTO fines (cycle_id, member_user_id, amount_cents, reason)
         VALUES ($1, $2, $3, $4)`,
        [currentCycle.id, s.user_id, fine, `Shortfall on cycle ${currentCycle.period_start}`]
      );
    }

    // 4. Open a new cycle
    const newPeriodStart = new Date().toISOString().slice(0, 10);
    const newPeriodEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    await client.query(
      `INSERT INTO cycles (chama_id, period_start, period_end, expected_total_cents)
       VALUES ($1, $2, $3, $4)`,
      [chama.chat_id, newPeriodStart, newPeriodEnd, chama.monthly_amount_cents * (await getMemberCount(client, chama.chat_id))]
    );

    await client.query("COMMIT");

    // 5. Announce in the group (outside the transaction)
    await sendCycleSummary(chama, currentCycle, shortfalls);
    
    // 6. Generate and send the monthly PDF to the treasurer
    try {
      const filePath = await generateMonthlyPdf(chama.chat_id, currentCycle.id);
      const bot = telegramService.getBot();
      await bot.sendDocument(chama.treasurer_user_id, filePath, {}, {
        filename: `${chama.name}-${currentCycle.period_start}.pdf`,
      });
    } catch (err) {
      console.error(`PDF generation/send failed for ${chama.chat_id}:`, err);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getMemberCount(client, chamaId) {
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS count FROM chama_members WHERE chama_id = $1 AND left_at IS NULL",
    [chamaId]
  );
  return rows[0].count;
}

// Builds and sends the public "cycle closed" summary to the group, after
// the transaction has committed -- this is a side effect, not part of the
// atomic close/open/fines logic above.
async function sendCycleSummary(chama, cycle, shortfalls) {
  const totalCollected = shortfalls.reduce((sum, s) => sum + parseInt(s.contributed, 10), 0);
  const late = shortfalls.filter((s) => parseInt(s.contributed, 10) < chama.monthly_amount_cents);

  const lines = [
    `Cycle ${cycle.period_start} closed.`,
    `Total collected: KSh ${(totalCollected / 100).toLocaleString()}`,
    `Members on time: ${shortfalls.length - late.length} / ${shortfalls.length}`,
    "",
    `Late members:`,
    ...late.map((s) => `- ${s.name}: KSh ${((parseInt(s.expected, 10) - parseInt(s.contributed, 10)) / 100).toLocaleString()} short`),
    "",
    `New cycle opened for ${new Date(cycle.period_end).toLocaleDateString("en-KE", { month: "long" })}.`,
  ];

  await telegramService.sendMessage(chama.chat_id, lines.join("\n"));
}

// Runs the evening before cycle day: nudges the group publicly, then DMs
// each late member privately. Two channels so a member has to miss both to
// stay unaware.
async function sendCycleReminders() {
  const tomorrow = new Date(Date.now() + 86400000).getDate();

  const { rows: chamas } = await query(
    "SELECT * FROM chamas WHERE cycle_day = $1",
    [tomorrow]
  );

  for (const chama of chamas) {
    // Find members who have not contributed for the current open cycle
    const { rows: late } = await query(
      `SELECT m.user_id, m.name
       FROM chama_members m
       LEFT JOIN contributions c ON c.member_user_id = m.user_id
         AND c.cycle_id = (SELECT id FROM cycles WHERE chama_id = $1 AND status = 'open')
         AND c.status = 'confirmed'
       WHERE m.chama_id = $1 AND m.left_at IS NULL
       GROUP BY m.user_id, m.name
       HAVING COALESCE(SUM(c.amount_cents), 0) < $2`,
      [chama.chat_id, chama.monthly_amount_cents]
    );

    if (late.length === 0) continue;

    // Post a gentle reminder in the group
    await telegramService.sendMessage(chama.chat_id,
      `Tomorrow is cycle day. These members still need to contribute:\n` +
      late.map((m) => `- ${m.name}`).join("\n") +
      `\n\nType /contribute now to avoid fines.`
    );

    // And privately DM each late member
    for (const m of late) {
      try {
        await telegramService.sendMessage(m.user_id,
          `Hi ${m.name}, reminder: tomorrow is the cycle day for ${chama.name}. Run /contribute to pay in.`
        );
      } catch (err) {
        // 403 means no private chat; group reminder already sent
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

module.exports = { processCycles, sendCycleReminders };
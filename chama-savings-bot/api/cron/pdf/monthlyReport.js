// server/cron/pdf/monthlyReport.js

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { query } = require("../../config/db");

async function generateMonthlyPdf(chamaId, cycleId) {
  const reportsDir = path.join(__dirname, "../../../reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, `${chamaId}-${cycleId}.pdf`);
  const stream = fs.createWriteStream(filePath);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Title
  const { rows: chamaRows } = await query("SELECT * FROM chamas WHERE chat_id = $1", [chamaId]);
  const chama = chamaRows[0];

  const { rows: cycleRows } = await query("SELECT * FROM cycles WHERE id = $1", [cycleId]);
  const cycle = cycleRows[0];

  doc.fontSize(20).text(`${chama.name} — Monthly Report`, { align: "center" });
  doc.moveDown();
  doc.fontSize(10).fillColor("gray")
    .text(`Cycle: ${cycle.period_start} to ${cycle.period_end}`, { align: "center" });
  doc.fillColor("black");
  doc.moveDown(2);

  // Summary stats
  const { rows: statsRows } = await query(
    `SELECT
       COALESCE(SUM(amount_cents) FILTER (WHERE status = 'confirmed'), 0) AS total_collected,
       COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count
     FROM contributions WHERE cycle_id = $1`,
    [cycleId]
  );
  const stats = statsRows[0];

  doc.fontSize(14).text("Summary");
  doc.fontSize(11)
    .text(`Total collected: KSh ${(stats.total_collected / 100).toLocaleString()}`)
    .text(`Expected: KSh ${(cycle.expected_total_cents / 100).toLocaleString()}`);
  doc.moveDown(1.5);

  // Member-by-member breakdown
  const { rows: members } = await query(
    `SELECT m.user_id, m.name,
            COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'confirmed'), 0) AS contributed
     FROM chama_members m
     LEFT JOIN contributions c ON c.member_user_id = m.user_id AND c.cycle_id = $1
     WHERE m.chama_id = $2 AND m.left_at IS NULL
     GROUP BY m.user_id, m.name
     ORDER BY m.name`,
    [cycleId, chamaId]
  );

  doc.fontSize(14).text("Member Breakdown");
  doc.fontSize(11);
  for (const m of members) {
    doc.text(`${m.name}: KSh ${(m.contributed / 100).toLocaleString()}`);
  }
  doc.moveDown(1.5);

  // Fines
  const { rows: fines } = await query(
    `SELECT f.amount_cents, f.reason, m.name
     FROM fines f
     JOIN chama_members m ON m.user_id = f.member_user_id AND m.chama_id = $2
     WHERE f.cycle_id = $1`,
    [cycleId, chamaId]
  );

  doc.fontSize(14).text("Fines");
  doc.fontSize(11);
  if (fines.length === 0) {
    doc.text("No fines this cycle.");
  } else {
    for (const f of fines) {
      doc.text(`${f.name}: KSh ${(f.amount_cents / 100).toLocaleString()} — ${f.reason}`);
    }
  }

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(filePath)));
}

module.exports = { generateMonthlyPdf };
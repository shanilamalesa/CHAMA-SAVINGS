// server/cron/index.js
//
// Reads the job registry and actually schedules each entry with node-cron.
// Every fire is logged to cron_runs: a 'running' row on start, then updated
// to 'success' or 'failed' when the job's run() function settles.

const cron = require("node-cron");
const { query } = require("../config/db");
const jobs = require("./registry");

async function logStart(jobName) {
  const { rows } = await query(
    `INSERT INTO cron_runs (job_name, started_at, status)
     VALUES ($1, NOW(), 'running')
     RETURNING id`,
    [jobName]
  );
  return rows[0].id;
}

async function logFinish(runId, status, errorMessage = null) {
  await query(
    `UPDATE cron_runs
     SET finished_at = NOW(), status = $2, error_message = $3
     WHERE id = $1`,
    [runId, status, errorMessage]
  );
}

async function runJob(job) {
  const runId = await logStart(job.name);
  try {
    await job.run();
    await logFinish(runId, "success");
    console.log(`✓ Cron job "${job.name}" completed`);
  } catch (err) {
    console.error(`✗ Cron job "${job.name}" failed:`, err);
    await logFinish(runId, "failed", err.message);
  }
}

function startCronJobs() {
  for (const job of jobs) {
    cron.schedule(job.schedule, () => runJob(job), { timezone: job.timezone });
    console.log(`✓ Scheduled cron job "${job.name}" (${job.schedule}, ${job.timezone})`);
  }
}

module.exports = { startCronJobs, runJob };
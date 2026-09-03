require("dotenv").config();
const { Client } = require("pg");

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();
  const { rows } = await client.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'notification_attempts'
     ORDER BY ordinal_position`
  );
  console.log(rows.length ? rows : "Table does not exist");
  await client.end();
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
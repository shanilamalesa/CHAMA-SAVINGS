require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await client.connect();
  await client.query(sql);
  console.log("Migration applied.");
  await client.end();
})().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
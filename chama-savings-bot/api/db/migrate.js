#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    await client.query('BEGIN');

    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    await client.query(schema);

    await client.query('COMMIT');
    console.log('✓ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

migrate();

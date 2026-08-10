-- Telegram Chats tracking
CREATE TABLE IF NOT EXISTS telegram_chats (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('private', 'group', 'supergroup', 'channel')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chama configuration
CREATE TABLE IF NOT EXISTS chamas (
  chat_id BIGINT PRIMARY KEY REFERENCES telegram_chats(id),
  name TEXT NOT NULL,
  monthly_amount_cents INTEGER NOT NULL CHECK (monthly_amount_cents > 0),
  fine_percent NUMERIC(5,2) DEFAULT 2.00,
  cycle_day INTEGER NOT NULL DEFAULT 1 CHECK (cycle_day BETWEEN 1 AND 28),
  treasurer_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chama membership
CREATE TABLE IF NOT EXISTS chama_members (
  chama_id BIGINT REFERENCES chamas(chat_id),
  user_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (chama_id, user_id)
);

-- Contribution cycles
CREATE TABLE IF NOT EXISTS cycles (
  id BIGSERIAL PRIMARY KEY,
  chama_id BIGINT REFERENCES chamas(chat_id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  expected_total_cents INTEGER NOT NULL,
  UNIQUE (chama_id, period_start)
);

-- Member contributions
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id BIGINT REFERENCES cycles(id),
  chama_id BIGINT,
  member_user_id BIGINT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  mpesa_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Late payment fines
CREATE TABLE IF NOT EXISTS fines (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT REFERENCES cycles(id),
  member_user_id BIGINT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Money going out
CREATE TABLE IF NOT EXISTS payouts (
  id BIGSERIAL PRIMARY KEY,
  chama_id BIGINT,
  recipient_user_id BIGINT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL
);

-- Outbox for async events
CREATE TABLE IF NOT EXISTS outbox (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Dashboard sessions (bot-token auth)
CREATE TABLE IF NOT EXISTS dashboard_sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Member onboarding state
CREATE TABLE IF NOT EXISTS member_onboarding (
  user_id BIGINT PRIMARY KEY,
  chama_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron execution log
CREATE TABLE IF NOT EXISTS cron_runs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  error_message TEXT
);

-- Indices for performance
CREATE INDEX idx_chama_members_chama ON chama_members(chama_id);
CREATE INDEX idx_cycles_chama ON cycles(chama_id);
CREATE INDEX idx_contributions_cycle ON contributions(cycle_id);
CREATE INDEX idx_contributions_member ON contributions(member_user_id);
CREATE INDEX idx_fines_cycle ON fines(cycle_id);
CREATE INDEX idx_fines_member ON fines(member_user_id);
CREATE INDEX idx_outbox_processed ON outbox(processed);
CREATE INDEX idx_dashboard_sessions_expires ON dashboard_sessions(expires_at);

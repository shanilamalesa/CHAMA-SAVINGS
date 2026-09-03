CREATE TABLE IF NOT EXISTS notification_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  channel      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'sent', 'failed', 'delayed', 'dead')
  ),
  CONSTRAINT valid_channel CHECK (
    channel IN ('telegram', 'whatsapp', 'sms')
  )
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_created
  ON notification_attempts (user_id, created_at DESC);
-- Retry-safe digest delivery, double opt-in, and event reminders

ALTER TABLE digest_subscriptions ADD COLUMN confirmation_token TEXT;
ALTER TABLE digest_subscriptions ADD COLUMN confirmed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_digest_confirmation_token
  ON digest_subscriptions(confirmation_token);

CREATE TABLE IF NOT EXISTS digest_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES digest_subscriptions(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  attempted_at TEXT DEFAULT (datetime('now')),
  sent_at TEXT,
  UNIQUE(subscription_id, period_start)
);

CREATE TABLE IF NOT EXISTS event_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT '24_hour',
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  attempted_at TEXT DEFAULT (datetime('now')),
  sent_at TEXT,
  UNIQUE(event_id, profile_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_digest_deliveries_period
  ON digest_deliveries(period_start, status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status
  ON event_reminders(status, attempted_at);

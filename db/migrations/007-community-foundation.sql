-- Community retention, trust, and reputation foundation

ALTER TABLE profiles ADD COLUMN reputation_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN trust_level INTEGER NOT NULL DEFAULT 0;

ALTER TABLE events ADD COLUMN capacity INTEGER;
ALTER TABLE events ADD COLUMN allow_waitlist INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS event_rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'waitlist', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(event_id, profile_id)
);

CREATE TABLE IF NOT EXISTS digest_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'paused')),
  topics TEXT NOT NULL DEFAULT '["events","board","projects","intel"]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_sent_at TEXT
);

CREATE TABLE IF NOT EXISTS content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('board_post', 'profile', 'project', 'event')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'unsafe', 'off_topic', 'other')),
  details TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  moderator_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  UNIQUE(reporter_profile_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS reputation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  source_type TEXT,
  source_id INTEGER,
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profile_badges (
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  awarded_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_profile ON event_rsvps(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_digest_subscriptions_status ON digest_subscriptions(status, frequency);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON reputation_events(profile_id, event_type);

-- Question and answer workflow on top of the existing message board.

ALTER TABLE board_posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'discussion'
  CHECK (post_type IN ('discussion', 'question'));
ALTER TABLE board_posts ADD COLUMN needs_mentor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE board_posts ADD COLUMN accepted_reply_id INTEGER REFERENCES board_posts(id) ON DELETE SET NULL;
ALTER TABLE board_posts ADD COLUMN accepted_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE board_posts ADD COLUMN accepted_at TEXT;
ALTER TABLE board_posts ADD COLUMN helpful_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS board_helpful_votes (
  reply_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (reply_id, profile_id)
);

CREATE TABLE IF NOT EXISTS board_answer_acceptance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transition_key TEXT NOT NULL UNIQUE,
  question_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  previous_reply_id INTEGER REFERENCES board_posts(id) ON DELETE SET NULL,
  accepted_reply_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  accepted_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('profile', 'business_contact')),
  recipient_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  dedupe_key TEXT NOT NULL UNIQUE,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,
  error_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_board_posts_question_state
  ON board_posts(post_type, needs_mentor, accepted_reply_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_helpful_votes_profile
  ON board_helpful_votes(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_acceptance_history_question
  ON board_answer_acceptance_history(question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_notifications_delivery
  ON community_notifications(status, attempted_at);

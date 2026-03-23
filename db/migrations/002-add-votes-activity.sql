CREATE TABLE IF NOT EXISTS idea_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER NOT NULL REFERENCES ideas(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idea_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_profile ON idea_votes(profile_id);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  profile_id INTEGER REFERENCES profiles(id),
  target_type TEXT,
  target_id INTEGER,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);

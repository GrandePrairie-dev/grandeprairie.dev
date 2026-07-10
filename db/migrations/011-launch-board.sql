-- Monthly community launch board

CREATE TABLE IF NOT EXISTS launch_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS launch_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL REFERENCES launch_cycles(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  pitch TEXT,
  votes_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(cycle_id, project_id),
  UNIQUE(cycle_id, submitted_by_profile_id)
);

CREATE TABLE IF NOT EXISTS launch_votes (
  entry_id INTEGER NOT NULL REFERENCES launch_entries(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_cycles_dates
  ON launch_cycles(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_launch_entries_cycle
  ON launch_entries(cycle_id, votes_count DESC, submitted_at ASC);
CREATE INDEX IF NOT EXISTS idx_launch_votes_profile
  ON launch_votes(profile_id, created_at DESC);

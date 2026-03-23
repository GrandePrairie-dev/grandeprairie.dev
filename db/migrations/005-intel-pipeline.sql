ALTER TABLE intel ADD COLUMN is_automated INTEGER DEFAULT 0;
ALTER TABLE intel ADD COLUMN source_feed TEXT;

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_date TEXT NOT NULL,
  sources_checked INTEGER DEFAULT 0,
  items_fetched INTEGER DEFAULT 0,
  items_drafted INTEGER DEFAULT 0,
  items_accepted INTEGER DEFAULT 0,
  items_rejected INTEGER DEFAULT 0,
  reject_reasons TEXT DEFAULT '[]',
  duration_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

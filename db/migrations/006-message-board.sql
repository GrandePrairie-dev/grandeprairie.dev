-- Message board threads and replies

CREATE TABLE IF NOT EXISTS board_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  author_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
  is_pinned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_board_posts_parent ON board_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at);

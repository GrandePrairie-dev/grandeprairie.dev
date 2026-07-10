-- Curated topic groups and membership

CREATE TABLE IF NOT EXISTS community_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS group_memberships (
  group_id INTEGER NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'organizer')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_profile
  ON group_memberships(profile_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group
  ON group_memberships(group_id, role, joined_at);

INSERT OR IGNORE INTO community_groups (slug, name, description, tags) VALUES
  ('ai', 'Applied AI', 'Practical AI for field operations, local businesses, education, and regional industries.', '["AI","automation","data"]'),
  ('founders', 'Founders', 'People starting, testing, funding, and operating new ventures in the Peace Region.', '["startups","business","funding"]'),
  ('developers', 'Developers', 'Software, cloud, web, mobile, data, and infrastructure builders at every level.', '["software","cloud","web"]'),
  ('students', 'Students', 'Learners, interns, new graduates, and people making their first technical contribution.', '["students","learning","internships"]'),
  ('design', 'Design', 'Product, service, brand, user experience, and communication design for useful local work.', '["design","product","UX"]'),
  ('cybersecurity', 'Cybersecurity', 'Security, privacy, resilience, and safe technology practices for regional organizations.', '["security","privacy","infrastructure"]');

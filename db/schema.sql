-- GrandePrairie.dev D1 Schema
-- Run: npm run db:migrate (remote) or npm run db:migrate:local

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  title TEXT,
  bio TEXT,
  role TEXT DEFAULT 'member',
  skills TEXT DEFAULT '[]',       -- JSON array
  badges TEXT DEFAULT '[]',       -- JSON array
  links TEXT DEFAULT '{}',        -- JSON object
  is_featured INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  author_id INTEGER REFERENCES profiles(id),
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  is_featured INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  repo_url TEXT,
  demo_url TEXT,
  author_id INTEGER REFERENCES profiles(id),
  collaborators TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  is_featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  organizer_id INTEGER REFERENCES profiles(id),
  link TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT,
  source_url TEXT,
  author_id INTEGER REFERENCES profiles(id),
  is_pinned INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  problem TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'new',
  matched_profile_id INTEGER REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  difficulty TEXT,
  link TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_intel_created ON intel(created_at);
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON business_requests(status);
CREATE INDEX IF NOT EXISTS idx_student_resources_type ON student_resources(resource_type);

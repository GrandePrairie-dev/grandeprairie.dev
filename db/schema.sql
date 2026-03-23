-- GrandePrairie.dev — Complete D1 Schema
-- This file is the consolidated schema reflecting all migrations (001-005).
-- For incremental updates, add new migration files in db/migrations/
-- Last consolidated: 2026-03-22

-- ============================================================
-- Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  title TEXT,
  bio TEXT,
  role TEXT DEFAULT 'member',
  skills TEXT DEFAULT '[]',           -- JSON array
  badges TEXT DEFAULT '[]',           -- JSON array
  links TEXT DEFAULT '{}',            -- JSON object
  is_featured INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  avatar_url TEXT,
  -- 001-add-github-auth
  github_id TEXT,
  github_username TEXT,
  -- 003-phase3-opportunity
  mentor_available INTEGER DEFAULT 0,
  mentor_topics TEXT DEFAULT '[]',    -- JSON array
  -- 004-auth-expansion
  google_id TEXT,
  auth_provider TEXT DEFAULT 'github',
  email_verified INTEGER DEFAULT 0,
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
  -- 005-intel-pipeline
  is_automated INTEGER DEFAULT 0,
  source_feed TEXT,
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

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES profiles(id),
  idea_id INTEGER REFERENCES ideas(id),
  project_id INTEGER REFERENCES projects(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Phase 2 — Votes & Activity (002-add-votes-activity)
-- ============================================================

CREATE TABLE IF NOT EXISTS idea_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER NOT NULL REFERENCES ideas(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idea_id, profile_id)
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  profile_id INTEGER REFERENCES profiles(id),
  target_type TEXT,
  target_id INTEGER,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Phase 3 — Opportunity (003-phase3-opportunity)
-- ============================================================

CREATE TABLE IF NOT EXISTS business_request_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_request_id INTEGER NOT NULL REFERENCES business_requests(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_request_id, profile_id)
);

CREATE TABLE IF NOT EXISTS mentor_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentee_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  mentor_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  location TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  PRIMARY KEY (organization_id, profile_id)
);

CREATE TABLE IF NOT EXISTS organization_projects (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, project_id)
);

-- ============================================================
-- Phase 4 — Intel Pipeline (005-intel-pipeline)
-- ============================================================

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

-- ============================================================
-- Indexes
-- ============================================================

-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ideas
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);

-- idea_votes
CREATE INDEX IF NOT EXISTS idx_idea_votes_idea ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_profile ON idea_votes(profile_id);

-- events
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);

-- intel
CREATE INDEX IF NOT EXISTS idx_intel_created ON intel(created_at);

-- business_requests
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON business_requests(status);

-- business_request_interests
CREATE INDEX IF NOT EXISTS idx_bri_request ON business_request_interests(business_request_id);
CREATE INDEX IF NOT EXISTS idx_bri_profile ON business_request_interests(profile_id);

-- student_resources
CREATE INDEX IF NOT EXISTS idx_student_resources_type ON student_resources(resource_type);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_idea ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);

-- activity
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);

-- mentor_requests
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);

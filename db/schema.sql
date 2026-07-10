-- GrandePrairie.dev — Complete D1 Schema
-- This file is the consolidated schema reflecting all migrations (001-008).
-- For incremental updates, add new migration files in db/migrations/
-- Last consolidated: 2026-07-09

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
  -- 007-community-foundation
  reputation_points INTEGER NOT NULL DEFAULT 0,
  trust_level INTEGER NOT NULL DEFAULT 0,
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
  -- 007-community-foundation
  capacity INTEGER,
  allow_waitlist INTEGER NOT NULL DEFAULT 1,
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
-- Community Foundation (007-community-foundation)
-- ============================================================

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
  confirmation_token TEXT UNIQUE,
  confirmed_at TEXT,
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
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_profile ON event_rsvps(profile_id, status);

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

-- board_posts
CREATE INDEX IF NOT EXISTS idx_board_posts_parent ON board_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at);

-- activity
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);

-- community foundation
CREATE INDEX IF NOT EXISTS idx_digest_subscriptions_status ON digest_subscriptions(status, frequency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_digest_confirmation_token ON digest_subscriptions(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_digest_deliveries_period ON digest_deliveries(period_start, status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON event_reminders(status, attempted_at);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON reputation_events(profile_id, event_type);

-- mentor_requests
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);

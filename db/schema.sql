-- GrandePrairie.dev — Complete D1 Schema
-- This file is the consolidated schema reflecting all migrations (001-013).
-- For incremental updates, add new migration files in db/migrations/
-- Last consolidated: 2026-07-10

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

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (
    employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'cofounder', 'volunteer')
  ),
  workplace_type TEXT NOT NULL DEFAULT 'onsite' CHECK (
    workplace_type IN ('onsite', 'hybrid', 'remote')
  ),
  location TEXT,
  compensation_min INTEGER,
  compensation_max INTEGER,
  compensation_currency TEXT NOT NULL DEFAULT 'CAD',
  compensation_period TEXT CHECK (
    compensation_period IS NULL OR compensation_period IN ('hour', 'year', 'project')
  ),
  application_url TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  posted_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'community' CHECK (source IN ('community', 'careerlynx')),
  source_id TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'closed')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    compensation_min IS NULL OR compensation_max IS NULL OR compensation_max >= compensation_min
  )
);

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
  -- 010-question-answer-loop
  post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question')),
  needs_mentor INTEGER NOT NULL DEFAULT 0,
  accepted_reply_id INTEGER REFERENCES board_posts(id) ON DELETE SET NULL,
  accepted_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TEXT,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

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
-- Intelligence Foundation (009-intelligence-foundation)
-- ============================================================

CREATE TABLE IF NOT EXISTS community_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  topic TEXT,
  source TEXT NOT NULL DEFAULT 'community',
  outcome TEXT,
  value REAL NOT NULL DEFAULT 1,
  metadata TEXT NOT NULL DEFAULT '{}',
  privacy_tier TEXT NOT NULL DEFAULT 'member' CHECK (privacy_tier IN ('aggregate', 'member', 'sensitive')),
  dedupe_key TEXT UNIQUE,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  retention_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendation_runs (
  id TEXT PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL,
  context_type TEXT,
  context_id TEXT,
  algorithm_key TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  context_snapshot TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'acted', 'expired', 'superseded')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS recommendation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES recommendation_runs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank > 0),
  score REAL NOT NULL,
  factors TEXT NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL,
  selected_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(run_id, item_type, item_id),
  UNIQUE(run_id, rank)
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES recommendation_runs(id) ON DELETE CASCADE,
  item_type TEXT,
  item_id TEXT,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('displayed', 'opened', 'selected', 'dismissed', 'helpful', 'not_helpful', 'completed')),
  value REAL,
  metadata TEXT NOT NULL DEFAULT '{}',
  dedupe_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matching_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_request_id INTEGER NOT NULL REFERENCES business_requests(id) ON DELETE CASCADE,
  recommendation_run_id TEXT REFERENCES recommendation_runs(id) ON DELETE SET NULL,
  selected_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  decided_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  decision_source TEXT NOT NULL DEFAULT 'manual' CHECK (decision_source IN ('manual', 'recommendation')),
  rationale TEXT,
  outcome_status TEXT NOT NULL DEFAULT 'pending' CHECK (outcome_status IN ('pending', 'successful', 'unsuccessful', 'cancelled')),
  outcome_notes TEXT,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  outcome_at TEXT
);

CREATE TABLE IF NOT EXISTS community_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'blocked')),
  strength REAL NOT NULL DEFAULT 1,
  provenance TEXT NOT NULL DEFAULT 'platform',
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS topic_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_days INTEGER NOT NULL CHECK (period_days > 0),
  signal_count INTEGER NOT NULL DEFAULT 0,
  unique_actors INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  sources TEXT NOT NULL DEFAULT '{}',
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(topic, period_start, period_days)
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  experiment_key TEXT NOT NULL UNIQUE,
  description TEXT,
  variants TEXT NOT NULL,
  allocation TEXT NOT NULL DEFAULT '{}',
  primary_metric TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  created_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (experiment_id, profile_id)
);

CREATE TABLE IF NOT EXISTS experiment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  variant TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 1,
  dedupe_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT,
  estimated_minutes INTEGER,
  objectives TEXT NOT NULL DEFAULT '[]',
  content_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_progress (
  module_id TEXT NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  PRIMARY KEY (module_id, profile_id)
);

CREATE TABLE IF NOT EXISTS learning_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id TEXT NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  step_key TEXT,
  score REAL,
  metadata TEXT NOT NULL DEFAULT '{}',
  dedupe_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
CREATE INDEX IF NOT EXISTS idx_board_posts_question_state ON board_posts(post_type, needs_mentor, accepted_reply_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_helpful_votes_profile ON board_helpful_votes(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_acceptance_history_question ON board_answer_acceptance_history(question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_notifications_delivery ON community_notifications(status, attempted_at);

-- activity
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);

-- community foundation
CREATE INDEX IF NOT EXISTS idx_digest_subscriptions_status ON digest_subscriptions(status, frequency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_digest_confirmation_token ON digest_subscriptions(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_digest_deliveries_period ON digest_deliveries(period_start, status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON event_reminders(status, attempted_at);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON reputation_events(profile_id, event_type);
CREATE INDEX IF NOT EXISTS idx_launch_cycles_dates ON launch_cycles(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_launch_entries_cycle ON launch_entries(cycle_id, votes_count DESC, submitted_at ASC);
CREATE INDEX IF NOT EXISTS idx_launch_votes_profile ON launch_votes(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_public ON jobs(status, expires_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(employment_type, workplace_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_poster ON jobs(posted_by_profile_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_external_source ON jobs(source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_memberships_profile ON group_memberships(profile_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id, role, joined_at);

-- intelligence
CREATE INDEX IF NOT EXISTS idx_signals_actor_time ON community_signals(actor_profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_target_time ON community_signals(target_type, target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_topic_time ON community_signals(topic, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_runs_context ON recommendation_runs(recommendation_type, context_type, context_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_run ON recommendation_feedback(run_id, feedback_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matching_decisions_request ON matching_decisions(business_request_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON community_relationships(source_type, source_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON community_relationships(target_type, target_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_topic_trends_period ON topic_trends(period_start DESC, score DESC);
CREATE INDEX IF NOT EXISTS idx_experiment_events_metric ON experiment_events(experiment_id, metric, variant);
CREATE INDEX IF NOT EXISTS idx_learning_events_profile ON learning_events(profile_id, module_id, created_at DESC);

-- mentor_requests
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);

INSERT OR IGNORE INTO community_groups (slug, name, description, tags) VALUES
  ('ai', 'Applied AI', 'Practical AI for field operations, local businesses, education, and regional industries.', '["AI","automation","data"]'),
  ('founders', 'Founders', 'People starting, testing, funding, and operating new ventures in the Peace Region.', '["startups","business","funding"]'),
  ('developers', 'Developers', 'Software, cloud, web, mobile, data, and infrastructure builders at every level.', '["software","cloud","web"]'),
  ('students', 'Students', 'Learners, interns, new graduates, and people making their first technical contribution.', '["students","learning","internships"]'),
  ('design', 'Design', 'Product, service, brand, user experience, and communication design for useful local work.', '["design","product","UX"]'),
  ('cybersecurity', 'Cybersecurity', 'Security, privacy, resilience, and safe technology practices for regional organizations.', '["security","privacy","infrastructure"]');

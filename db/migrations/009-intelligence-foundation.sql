-- Durable, explainable community intelligence foundation.

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
  privacy_tier TEXT NOT NULL DEFAULT 'member'
    CHECK (privacy_tier IN ('aggregate', 'member', 'sensitive')),
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
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'acted', 'expired', 'superseded')),
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
  feedback_type TEXT NOT NULL
    CHECK (feedback_type IN ('displayed', 'opened', 'selected', 'dismissed', 'helpful', 'not_helpful', 'completed')),
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
  decision_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (decision_source IN ('manual', 'recommendation')),
  rationale TEXT,
  outcome_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (outcome_status IN ('pending', 'successful', 'unsuccessful', 'cancelled')),
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
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'inactive', 'blocked')),
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
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'running', 'paused', 'completed')),
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
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_progress (
  module_id TEXT NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
  progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent BETWEEN 0 AND 100),
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

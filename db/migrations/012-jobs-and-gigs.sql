-- Structured jobs and gigs directory

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

CREATE INDEX IF NOT EXISTS idx_jobs_public
  ON jobs(status, expires_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_type
  ON jobs(employment_type, workplace_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_poster
  ON jobs(posted_by_profile_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_external_source
  ON jobs(source, source_id) WHERE source_id IS NOT NULL;

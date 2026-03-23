-- Business request interests
CREATE TABLE IF NOT EXISTS business_request_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_request_id INTEGER NOT NULL REFERENCES business_requests(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_request_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_bri_request ON business_request_interests(business_request_id);
CREATE INDEX IF NOT EXISTS idx_bri_profile ON business_request_interests(profile_id);

-- Mentor fields on profiles
ALTER TABLE profiles ADD COLUMN mentor_available INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN mentor_topics TEXT DEFAULT '[]';

-- Mentor requests
CREATE TABLE IF NOT EXISTS mentor_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentee_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  mentor_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);

-- Organizations
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

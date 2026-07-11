-- Question-linked mentor routing and outcomes

ALTER TABLE profiles ADD COLUMN mentor_capacity INTEGER NOT NULL DEFAULT 2;

ALTER TABLE mentor_requests ADD COLUMN question_id INTEGER REFERENCES board_posts(id) ON DELETE SET NULL;
ALTER TABLE mentor_requests ADD COLUMN topic TEXT;
ALTER TABLE mentor_requests ADD COLUMN outcome_status TEXT CHECK (
  outcome_status IS NULL OR outcome_status IN ('successful', 'unsuccessful', 'cancelled')
);
ALTER TABLE mentor_requests ADD COLUMN outcome_notes TEXT;
ALTER TABLE mentor_requests ADD COLUMN outcome_at TEXT;

CREATE INDEX IF NOT EXISTS idx_mentor_requests_question
  ON mentor_requests(question_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_capacity
  ON mentor_requests(mentor_profile_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_requests_question_pair
  ON mentor_requests(question_id, mentor_profile_id)
  WHERE question_id IS NOT NULL AND status IN ('pending', 'accepted');

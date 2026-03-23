ALTER TABLE profiles ADD COLUMN github_id TEXT;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);

ALTER TABLE profiles ADD COLUMN google_id TEXT;
ALTER TABLE profiles ADD COLUMN auth_provider TEXT DEFAULT 'github';
ALTER TABLE profiles ADD COLUMN email_verified INTEGER DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

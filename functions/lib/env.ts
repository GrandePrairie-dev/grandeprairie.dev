export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SLACK_WEBHOOK_URL?: string;
  SITE_URL: string;
}

export interface UserContext {
  profileId: number;
  isAdmin: boolean;
}

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SLACK_WEBHOOK_URL?: string;
  SITE_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  PIPELINE_SECRET?: string;
  GROQ_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export interface UserContext {
  profileId: number;
  isAdmin: boolean;
}

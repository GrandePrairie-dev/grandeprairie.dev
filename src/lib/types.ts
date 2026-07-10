// ===== Data Models =====

export interface Profile {
  id: number;
  name: string;
  username: string;
  email: string | null;
  title: string | null;
  bio: string | null;
  role: string;
  skills: string; // JSON array string
  badges: string; // JSON array string
  links: string; // JSON object string
  is_featured: number;
  is_admin: number;
  avatar_url: string | null;
  auth_provider: string | null;
  google_id: string | null;
  email_verified: number;
  reputation_points: number;
  trust_level: number;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  author_id: number | null;
  votes: number;
  status: string;
  is_featured: number;
  tags: string; // JSON array string
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  repo_url: string | null;
  demo_url: string | null;
  author_id: number | null;
  collaborators: string; // JSON array string
  tags: string; // JSON array string
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface LaunchEntry {
  id: number;
  cycle_id: number;
  project_id: number;
  pitch: string | null;
  votes_count: number;
  submitted_at: string;
  title: string;
  description: string | null;
  category: string | null;
  repo_url: string | null;
  demo_url: string | null;
  tags: string;
  author_id: number | null;
  author_name: string | null;
  viewer_voted: number;
  rank: number;
}

export interface LaunchCycle {
  id: number;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  is_open: boolean;
  entries: LaunchEntry[];
}

export interface ReputationSummary {
  points: number;
  trust_level: number;
  next_level_points: number | null;
  badges: Array<{ key: string; awarded_at: string }>;
  contributions: Array<{ event_type: string; count: number; points: number }>;
  recent: Array<{
    id: number;
    event_type: string;
    points: number;
    source_type: string | null;
    source_id: number | null;
    created_at: string;
  }>;
}

export interface Job {
  id: number;
  title: string;
  organization: string;
  description: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship" | "cofounder" | "volunteer";
  workplace_type: "onsite" | "hybrid" | "remote";
  location: string | null;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: string;
  compensation_period: "hour" | "year" | "project" | null;
  application_url: string;
  tags: string;
  posted_by_profile_id: number | null;
  poster_name: string | null;
  source: "community" | "careerlynx";
  source_url: string | null;
  status: "published" | "closed";
  expires_at: string;
  created_at: string;
  updated_at: string;
  viewer_can_manage: number;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  organizer_id: number | null;
  link: string | null;
  capacity: number | null;
  allow_waitlist: number;
  attendee_count: number;
  waitlist_count: number;
  my_rsvp: "attending" | "waitlist" | "cancelled" | null;
  created_at: string;
}

export interface ContentReport {
  id: number;
  reporter_profile_id: number;
  reporter_name: string;
  target_type: "board_post" | "profile" | "project" | "event";
  target_id: number;
  target_label: string | null;
  reason: string;
  details: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "reviewing" | "resolved" | "dismissed";
  moderator_profile_id: number | null;
  moderator_name: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface IntelPost {
  id: number;
  title: string;
  body: string | null;
  category: string | null;
  source_url: string | null;
  author_id: number | null;
  is_pinned: number;
  is_featured: number;
  is_automated: number;
  source_feed: string | null;
  tags: string; // JSON array string
  created_at: string;
}

export interface BusinessRequest {
  id: number;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  problem: string;
  category: string;
  status: string;
  matched_profile_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecommendationFactor {
  score: number;
  max: number;
  detail: string;
  matches?: string[];
}

export interface BuilderRecommendation {
  profile_id: number;
  name: string;
  username: string;
  title: string | null;
  role: string;
  skills: string[];
  score: number;
  rank: number;
  factors: Record<string, RecommendationFactor>;
  explanation: string;
}

export interface BuilderRecommendationRun {
  id: string;
  algorithm_key: string;
  algorithm_version: string;
  created_at: string;
  expires_at: string | null;
  items: BuilderRecommendation[];
}

export interface StudentResource {
  id: number;
  title: string;
  description: string | null;
  resource_type: string;
  difficulty: string | null;
  link: string | null;
  tags: string; // JSON array string
  created_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number | null;
  author_name?: string; // joined from profiles
  idea_id: number | null;
  project_id: number | null;
  created_at: string;
}

export interface BoardPost {
  id: number;
  title: string | null;
  body: string;
  category: string;
  author_id: number | null;
  author_name?: string | null;
  author_role?: string | null;
  author_avatar_url?: string | null;
  parent_id: number | null;
  reply_count: number;
  is_pinned: number;
  status: string;
  post_type: "discussion" | "question";
  needs_mentor: number;
  accepted_reply_id: number | null;
  accepted_by_profile_id: number | null;
  accepted_at: string | null;
  helpful_count: number;
  viewer_found_helpful?: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  profiles: number;
  ideas: number;
  events: number;
  projects: number;
}

// ===== Constants =====

export const ROLES = ["developer", "trades", "student", "founder", "operator", "mentor"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  all: "All",
  developer: "Developer",
  trades: "Trades",
  student: "Student",
  founder: "Founder",
  operator: "Operator",
  mentor: "Mentor",
};

export const IDEA_CATEGORIES = ["problem", "startup", "ai_use_case", "field_pain_point", "student_idea", "business_need"] as const;

export const IDEA_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  problem: "Problems",
  startup: "Startups",
  ai_use_case: "AI",
  field_pain_point: "Field",
  student_idea: "Student",
  business_need: "Business",
};

export const EVENT_CATEGORIES = ["meetup", "workshop", "hackathon", "talk", "social", "other"] as const;

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  meetup: "Meetup",
  workshop: "Workshop",
  hackathon: "Hackathon",
  talk: "Talk",
  social: "Social",
  other: "Other",
};

export const INTEL_CATEGORIES = ["hiring", "project_activity", "industry", "events", "opportunity"] as const;
export type IntelCategory = (typeof INTEL_CATEGORIES)[number];

export const INTEL_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  hiring: "Hiring",
  project_activity: "Projects",
  industry: "Industry",
  events: "Events",
  opportunity: "Opportunity",
};

export const BOARD_CATEGORIES = ["general", "help", "jobs", "events", "showcase", "field_notes"] as const;

export const BOARD_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  general: "General",
  help: "Help",
  jobs: "Jobs",
  events: "Events",
  showcase: "Showcase",
  field_notes: "Field Notes",
};

export const ROLE_COLORS: Record<string, string> = {
  developer: "#1B6B6D",
  trades: "#D4943A",
  student: "#28A745",
  founder: "#DC3545",
  operator: "#6F42C1",
  mentor: "#6BA3BE",
};

// ===== Helpers =====

export function parseJsonArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

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
  created_at: string;
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

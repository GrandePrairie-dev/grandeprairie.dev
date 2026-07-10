import type { Env } from "./env";

type JsonRecord = Record<string, unknown>;
type PrivacyTier = "aggregate" | "member" | "sensitive";

export interface SignalInput {
  actorProfileId?: number | null;
  signalType: string;
  targetType: string;
  targetId: string | number;
  topic?: string | null;
  source?: string;
  outcome?: string | null;
  value?: number;
  metadata?: JsonRecord;
  privacyTier?: PrivacyTier;
  dedupeKey?: string | null;
  retentionUntil?: string | null;
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

interface CandidateRow {
  id: number;
  name: string;
  username: string;
  title: string | null;
  bio: string | null;
  role: string;
  skills: string;
  links: string;
  reputation_points: number;
  trust_level: number;
  interest_id: number | null;
}

interface BusinessRequestRow {
  id: number;
  category: string;
  problem: string;
}

const BUILDER_MATCH_ALGORITHM = "builder-match-rules";
const BUILDER_MATCH_VERSION = "1.0.0";
const STOP_WORDS = new Set([
  "about", "after", "again", "also", "been", "being", "business", "could", "from",
  "have", "help", "into", "local", "need", "needs", "other", "our", "that", "their",
  "there", "these", "they", "this", "through", "want", "with", "would", "your",
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "automation", "machine learning", "python", "data", "analytics", "llm"],
  automation: ["automation", "workflow", "integration", "api", "python", "scripting", "operations"],
  data: ["data", "analytics", "sql", "python", "reporting", "dashboard", "tableau", "power bi"],
  website: ["web", "website", "react", "typescript", "javascript", "design", "seo", "ecommerce"],
  mobile: ["mobile", "ios", "android", "react native", "flutter", "app"],
  cybersecurity: ["security", "cybersecurity", "network", "cloud", "identity", "compliance"],
  other: ["technology", "project", "operations", "digital"],
};

const CATEGORY_ROLES: Record<string, string[]> = {
  ai: ["developer", "operator", "student"],
  automation: ["developer", "operator", "trades"],
  data: ["developer", "operator", "student"],
  website: ["developer", "founder", "student"],
  mobile: ["developer", "student"],
  cybersecurity: ["developer", "operator"],
  other: ["developer", "operator", "trades", "founder", "student", "mentor"],
};

function json(value: unknown, maxLength = 8000): string {
  try {
    const serialized = JSON.stringify(value ?? {});
    if (serialized.length <= maxLength) return serialized;
    return JSON.stringify({ truncated: true });
  } catch {
    return "{}";
  }
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseObject<T extends JsonRecord>(value: string): T {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : {} as T;
  } catch {
    return {} as T;
  }
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, " ")
      .split(/[\s,/|_-]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 2 && !STOP_WORDS.has(item)),
  );
}

function requestTerms(category: string, problem: string): string[] {
  const categoryTerms = CATEGORY_KEYWORDS[category] ?? CATEGORY_KEYWORDS.other;
  const problemTerms = [...tokens(problem)].slice(0, 16);
  return [...new Set([...categoryTerms, ...problemTerms])];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function recordSignal(env: Env, input: SignalInput): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO community_signals
         (actor_profile_id, signal_type, target_type, target_id, topic, source, outcome,
          value, metadata, privacy_tier, dedupe_key, retention_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      input.actorProfileId ?? null,
      input.signalType,
      input.targetType,
      String(input.targetId),
      input.topic?.trim().toLowerCase() || null,
      input.source ?? "community",
      input.outcome ?? null,
      Number.isFinite(input.value) ? input.value : 1,
      json(input.metadata),
      input.privacyTier ?? "member",
      input.dedupeKey ?? null,
      input.retentionUntil ?? null,
    ).run();
  } catch (error) {
    console.error("[intelligence] signal write failed", error);
  }
}

export async function upsertRelationship(
  env: Env,
  relationship: {
    sourceType: string;
    sourceId: string | number;
    targetType: string;
    targetId: string | number;
    relationshipType: string;
    status?: "pending" | "active" | "inactive" | "blocked";
    strength?: number;
    provenance?: string;
    metadata?: JsonRecord;
  },
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO community_relationships
         (source_type, source_id, target_type, target_id, relationship_type, status, strength, provenance, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(source_type, source_id, target_type, target_id, relationship_type) DO UPDATE SET
         status = excluded.status,
         strength = excluded.strength,
         provenance = excluded.provenance,
         metadata = excluded.metadata,
         updated_at = datetime('now')`,
    ).bind(
      relationship.sourceType,
      String(relationship.sourceId),
      relationship.targetType,
      String(relationship.targetId),
      relationship.relationshipType,
      relationship.status ?? "active",
      relationship.strength ?? 1,
      relationship.provenance ?? "platform",
      json(relationship.metadata),
    ).run();
  } catch (error) {
    console.error("[intelligence] relationship write failed", error);
  }
}

function scoreCandidate(
  candidate: CandidateRow,
  category: string,
  terms: string[],
): Omit<BuilderRecommendation, "rank"> {
  const skills = parseStringArray(candidate.skills);
  const candidateText = [candidate.role, candidate.title, candidate.bio, ...skills].filter(Boolean).join(" ").toLowerCase();
  const candidateTokens = tokens(candidateText);
  const matches = terms.filter((term) => {
    const normalized = term.toLowerCase();
    return normalized.includes(" ") ? candidateText.includes(normalized) : candidateTokens.has(normalized);
  }).slice(0, 6);

  const interestScore = candidate.interest_id ? 25 : 0;
  const skillScore = round(Math.min(45, matches.length * 9));
  const alignedRoles = CATEGORY_ROLES[category] ?? CATEGORY_ROLES.other;
  const roleScore = alignedRoles.includes(candidate.role) ? 10 : 0;
  const completenessParts = [candidate.title, candidate.bio, skills.length > 0, candidate.links !== "{}"];
  const completenessScore = completenessParts.filter(Boolean).length * 2.5;
  const reputationScore = round(Math.min(6, Math.max(0, candidate.reputation_points) / 20));
  const trustScore = round(Math.min(4, Math.max(0, candidate.trust_level)));

  const factors: Record<string, RecommendationFactor> = {
    expressed_interest: {
      score: interestScore,
      max: 25,
      detail: candidate.interest_id ? "Expressed interest in this request" : "Has not expressed interest",
    },
    relevant_skills: {
      score: skillScore,
      max: 45,
      detail: matches.length > 0 ? `${matches.length} relevant terms matched` : "No explicit skill match",
      matches,
    },
    role_alignment: {
      score: roleScore,
      max: 10,
      detail: roleScore > 0 ? `${candidate.role} aligns with ${category}` : `${candidate.role} is not a primary ${category} role`,
    },
    profile_completeness: {
      score: completenessScore,
      max: 10,
      detail: `${completenessParts.filter(Boolean).length} of 4 profile signals present`,
    },
    community_contribution: {
      score: round(reputationScore + trustScore),
      max: 10,
      detail: `${candidate.reputation_points} reputation points; trust level ${candidate.trust_level}`,
    },
  };

  const score = round(Object.values(factors).reduce((total, factor) => total + factor.score, 0));
  const reasons = [
    candidate.interest_id ? "expressed interest" : null,
    matches.length > 0 ? `matches ${matches.slice(0, 3).join(", ")}` : null,
    roleScore > 0 ? `${candidate.role} role aligns` : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    profile_id: candidate.id,
    name: candidate.name,
    username: candidate.username,
    title: candidate.title,
    role: candidate.role,
    skills,
    score,
    factors,
    explanation: reasons.length > 0 ? reasons.join("; ") : "Included for admin review; no strong match signal yet",
  };
}

export async function generateBuilderRecommendations(
  env: Env,
  requestId: number,
  adminProfileId: number,
): Promise<BuilderRecommendationRun | null> {
  const businessRequest = await env.DB.prepare(
    "SELECT id, category, problem FROM business_requests WHERE id = ?",
  ).bind(requestId).first<BusinessRequestRow>();
  if (!businessRequest) return null;

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.username, p.title, p.bio, p.role, p.skills, p.links,
            p.reputation_points, p.trust_level, bri.id AS interest_id
     FROM profiles p
     LEFT JOIN business_request_interests bri
       ON bri.profile_id = p.id AND bri.business_request_id = ?
     WHERE p.is_admin = 0 OR bri.id IS NOT NULL`,
  ).bind(requestId).all<CandidateRow>();

  const terms = requestTerms(businessRequest.category, businessRequest.problem);
  const items = results
    .map((candidate) => scoreCandidate(candidate, businessRequest.category, terms))
    .sort((a, b) => b.score - a.score
      || b.factors.expressed_interest.score - a.factors.expressed_interest.score
      || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const runId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(
      `UPDATE recommendation_runs SET status = 'superseded'
       WHERE recommendation_type = 'builder_match' AND context_type = 'business_request'
         AND context_id = ? AND status = 'generated'`,
    ).bind(String(requestId)),
    env.DB.prepare(
      `INSERT INTO recommendation_runs
         (id, profile_id, recommendation_type, context_type, context_id, algorithm_key,
          algorithm_version, context_snapshot, expires_at)
       VALUES (?, ?, 'builder_match', 'business_request', ?, ?, ?, ?, datetime('now', '+7 days'))`,
    ).bind(
      runId,
      adminProfileId,
      String(requestId),
      BUILDER_MATCH_ALGORITHM,
      BUILDER_MATCH_VERSION,
      json({ category: businessRequest.category, terms }),
    ),
    ...items.map((item) => env.DB.prepare(
      `INSERT INTO recommendation_items
         (run_id, item_type, item_id, rank, score, factors, explanation)
       VALUES (?, 'profile', ?, ?, ?, ?, ?)`,
    ).bind(runId, String(item.profile_id), item.rank, item.score, json(item.factors), item.explanation)),
  ];
  await env.DB.batch(statements);

  return {
    id: runId,
    algorithm_key: BUILDER_MATCH_ALGORITHM,
    algorithm_version: BUILDER_MATCH_VERSION,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
    items,
  };
}

export async function getLatestBuilderRecommendations(
  env: Env,
  requestId: number,
): Promise<BuilderRecommendationRun | null> {
  const run = await env.DB.prepare(
    `SELECT id, algorithm_key, algorithm_version, created_at, expires_at
     FROM recommendation_runs
     WHERE recommendation_type = 'builder_match' AND context_type = 'business_request'
       AND context_id = ? AND status IN ('generated', 'acted')
     ORDER BY created_at DESC LIMIT 1`,
  ).bind(String(requestId)).first<Omit<BuilderRecommendationRun, "items">>();
  if (!run) return null;

  const { results } = await env.DB.prepare(
    `SELECT ri.item_id AS profile_id, ri.rank, ri.score, ri.factors, ri.explanation,
            p.name, p.username, p.title, p.role, p.skills
     FROM recommendation_items ri
     JOIN profiles p ON p.id = CAST(ri.item_id AS INTEGER)
     WHERE ri.run_id = ? AND ri.item_type = 'profile'
     ORDER BY ri.rank ASC`,
  ).bind(run.id).all<{
    profile_id: string;
    rank: number;
    score: number;
    factors: string;
    explanation: string;
    name: string;
    username: string;
    title: string | null;
    role: string;
    skills: string;
  }>();

  return {
    ...run,
    items: results.map((item) => ({
      ...item,
      profile_id: Number(item.profile_id),
      skills: parseStringArray(item.skills),
      factors: parseObject<Record<string, RecommendationFactor>>(item.factors),
    })),
  };
}

export async function recordRecommendationFeedback(
  env: Env,
  input: {
    runId: string;
    profileId: number;
    feedbackType: "displayed" | "opened" | "selected" | "dismissed" | "helpful" | "not_helpful" | "completed";
    itemType?: string | null;
    itemId?: string | number | null;
    value?: number | null;
    metadata?: JsonRecord;
    dedupeKey?: string | null;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO recommendation_feedback
       (run_id, item_type, item_id, profile_id, feedback_type, value, metadata, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    input.runId,
    input.itemType ?? null,
    input.itemId === undefined || input.itemId === null ? null : String(input.itemId),
    input.profileId,
    input.feedbackType,
    input.value ?? null,
    json(input.metadata),
    input.dedupeKey ?? null,
  ).run();
}

export async function refreshTopicTrends(env: Env, periodDays = 30): Promise<number> {
  const boundedDays = Math.min(365, Math.max(1, Math.round(periodDays)));
  const periodStart = new Date(Date.now() - boundedDays * 86400_000).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    `SELECT topic, COUNT(*) AS signal_count, COUNT(DISTINCT actor_profile_id) AS unique_actors,
            ROUND(SUM(value * MAX(0.1, 1.0 - ((julianday('now') - julianday(occurred_at)) / ?))), 2) AS score,
            GROUP_CONCAT(DISTINCT source) AS source_list
     FROM community_signals
     WHERE topic IS NOT NULL AND occurred_at >= datetime('now', ?)
     GROUP BY topic
     ORDER BY score DESC`,
  ).bind(boundedDays * 1.25, `-${boundedDays} days`).all<{
    topic: string;
    signal_count: number;
    unique_actors: number;
    score: number;
    source_list: string | null;
  }>();

  if (results.length === 0) return 0;
  await env.DB.batch(results.map((trend) => env.DB.prepare(
    `INSERT INTO topic_trends
       (topic, period_start, period_days, signal_count, unique_actors, score, sources, computed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(topic, period_start, period_days) DO UPDATE SET
       signal_count = excluded.signal_count,
       unique_actors = excluded.unique_actors,
       score = excluded.score,
       sources = excluded.sources,
       computed_at = datetime('now')`,
  ).bind(
    trend.topic,
    periodStart,
    boundedDays,
    trend.signal_count,
    trend.unique_actors,
    trend.score,
    json((trend.source_list ?? "").split(",").filter(Boolean)),
  )));
  return results.length;
}

function stableBucket(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export async function assignExperimentVariant(
  env: Env,
  experimentKey: string,
  profileId: number,
): Promise<{ experiment_id: string; variant: string } | null> {
  const experiment = await env.DB.prepare(
    "SELECT id, variants, allocation FROM experiments WHERE experiment_key = ? AND status = 'running'",
  ).bind(experimentKey).first<{ id: string; variants: string; allocation: string }>();
  if (!experiment) return null;

  const existing = await env.DB.prepare(
    "SELECT variant FROM experiment_assignments WHERE experiment_id = ? AND profile_id = ?",
  ).bind(experiment.id, profileId).first<{ variant: string }>();
  if (existing) return { experiment_id: experiment.id, variant: existing.variant };

  const variants = parseStringArray(experiment.variants);
  if (variants.length < 2) return null;
  let allocation: Record<string, number> = {};
  try {
    allocation = parseObject<Record<string, number>>(experiment.allocation);
  } catch {
    allocation = {};
  }
  let weights = variants.map((variant) => {
    const configured = Number(allocation[variant]);
    return Number.isFinite(configured) ? Math.max(0, configured) : 1;
  });
  let total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) {
    weights = variants.map(() => 1);
    total = weights.length;
  }
  let cursor = stableBucket(`${experiment.id}:${profileId}`) * total;
  let variant = variants[variants.length - 1];
  for (let index = 0; index < variants.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) {
      variant = variants[index];
      break;
    }
  }

  await env.DB.prepare(
    `INSERT OR IGNORE INTO experiment_assignments (experiment_id, profile_id, variant) VALUES (?, ?, ?)`,
  ).bind(experiment.id, profileId, variant).run();
  return { experiment_id: experiment.id, variant };
}

export async function recordExperimentEvent(
  env: Env,
  input: {
    experimentId: string;
    profileId: number;
    variant: string;
    metric: string;
    value?: number;
    dedupeKey?: string | null;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO experiment_events
       (experiment_id, profile_id, variant, metric, value, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(
    input.experimentId,
    input.profileId,
    input.variant,
    input.metric,
    Number.isFinite(input.value) ? input.value : 1,
    input.dedupeKey ?? null,
  ).run();
}

export async function recordLearningEvent(
  env: Env,
  input: {
    moduleId: string;
    profileId: number;
    eventType: string;
    stepKey?: string | null;
    score?: number | null;
    progressPercent?: number;
    metadata?: JsonRecord;
    dedupeKey?: string | null;
  },
): Promise<void> {
  const requestedProgress = Math.min(100, Math.max(0, Math.round(input.progressPercent ?? 0)));
  const progress = input.eventType === "module_completed" ? 100 : requestedProgress;
  const completed = progress === 100;
  const status = completed ? "completed" : input.eventType === "module_abandoned" ? "abandoned" : "in_progress";
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO learning_events
         (module_id, profile_id, event_type, step_key, score, metadata, dedupe_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      input.moduleId,
      input.profileId,
      input.eventType,
      input.stepKey ?? null,
      input.score ?? null,
      json(input.metadata),
      input.dedupeKey ?? null,
    ),
    env.DB.prepare(
      `INSERT INTO learning_progress
         (module_id, profile_id, status, progress_percent, completed_at)
       VALUES (?, ?, ?, ?, CASE WHEN ? THEN datetime('now') ELSE NULL END)
       ON CONFLICT(module_id, profile_id) DO UPDATE SET
         status = excluded.status,
         progress_percent = MAX(learning_progress.progress_percent, excluded.progress_percent),
         last_activity_at = datetime('now'),
         completed_at = COALESCE(learning_progress.completed_at, excluded.completed_at)`,
    ).bind(input.moduleId, input.profileId, status, progress, completed ? 1 : 0),
  ]);
}

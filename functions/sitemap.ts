interface Env {
  DB?: D1Database;
  SITE_URL?: string;
}

interface SitemapEntry {
  path: string;
  priority: string;
  changefreq: string;
  lastmod?: string | null;
}

const SITEMAP_ROUTES: SitemapEntry[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/people", priority: "0.8", changefreq: "daily" },
  { path: "/ideas", priority: "0.8", changefreq: "daily" },
  { path: "/projects", priority: "0.7", changefreq: "weekly" },
  { path: "/map", priority: "0.7", changefreq: "weekly" },
  { path: "/calendar", priority: "0.8", changefreq: "daily" },
  { path: "/board", priority: "0.8", changefreq: "daily" },
  { path: "/intel", priority: "0.9", changefreq: "daily" },
  { path: "/tech-hub", priority: "0.6", changefreq: "weekly" },
  { path: "/students", priority: "0.6", changefreq: "weekly" },
  { path: "/business", priority: "0.7", changefreq: "daily" },
  { path: "/ai-hub", priority: "0.6", changefreq: "weekly" },
  { path: "/orgs", priority: "0.6", changefreq: "weekly" },
  { path: "/showcase", priority: "0.6", changefreq: "weekly" },
  { path: "/launches", priority: "0.8", changefreq: "weekly" },
  { path: "/jobs", priority: "0.8", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/agency", priority: "0.5", changefreq: "monthly" },
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateOnly(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function fetchDynamicEntries(env: Env): Promise<SitemapEntry[]> {
  if (!env.DB) return [];

  const entries: SitemapEntry[] = [];

  try {
    const [profiles, ideas, businessRequests, organizations] = await Promise.all([
      env.DB.prepare("SELECT id, updated_at, created_at FROM profiles ORDER BY updated_at DESC LIMIT 500").all(),
      env.DB.prepare("SELECT id, updated_at, created_at FROM ideas WHERE status != 'archived' ORDER BY updated_at DESC LIMIT 500").all(),
      env.DB.prepare("SELECT id, updated_at, created_at FROM business_requests ORDER BY updated_at DESC LIMIT 300").all(),
      env.DB.prepare("SELECT slug, created_at FROM organizations ORDER BY name LIMIT 300").all(),
    ]);

    for (const row of profiles.results as Array<{ id: number; updated_at?: string; created_at?: string }>) {
      entries.push({
        path: `/people/${encodeURIComponent(String(row.id))}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: dateOnly(row.updated_at ?? row.created_at),
      });
    }

    for (const row of ideas.results as Array<{ id: number; updated_at?: string; created_at?: string }>) {
      entries.push({
        path: `/ideas/${encodeURIComponent(String(row.id))}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: dateOnly(row.updated_at ?? row.created_at),
      });
    }

    for (const row of businessRequests.results as Array<{ id: number; updated_at?: string; created_at?: string }>) {
      entries.push({
        path: `/business/${encodeURIComponent(String(row.id))}`,
        priority: "0.5",
        changefreq: "weekly",
        lastmod: dateOnly(row.updated_at ?? row.created_at),
      });
    }

    for (const row of organizations.results as Array<{ slug: string; created_at?: string }>) {
      entries.push({
        path: `/orgs/${encodeURIComponent(row.slug)}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: dateOnly(row.created_at),
      });
    }
  } catch (error) {
    console.warn("Failed to build dynamic sitemap entries", error);
  }

  return entries;
}

export function buildSitemapXml(env: Env, dynamicEntries: SitemapEntry[] = []) {
  const baseUrl = (env.SITE_URL ?? "https://grandeprairie.dev").replace(/\/$/, "");
  const entries = [...SITEMAP_ROUTES, ...dynamicEntries];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(p => `  <url>
    <loc>${xmlEscape(`${baseUrl}${p.path}`)}</loc>
    ${p.lastmod ? `<lastmod>${xmlEscape(p.lastmod)}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const dynamicEntries = await fetchDynamicEntries(env);
  const xml = buildSitemapXml(env, dynamicEntries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

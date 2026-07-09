import type { Env } from "./env";

const SITE_URL = "https://grandeprairie.dev";
const DEFAULT_IMAGE = `${SITE_URL}/images/hero-aurora.webp`;

type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[];

interface JsonLdObject {
  [key: string]: JsonLdValue;
}

interface SeoMeta {
  path: string;
  title: string;
  description: string;
  keywords: string;
  pageType?: string;
  image?: string;
  noindex?: boolean;
  mainEntity?: JsonLdObject;
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJson(value: JsonLdObject) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function truncate(value: string | null | undefined, fallback: string, limit = 155) {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).trim()}…`;
}

function parseTags(value: unknown) {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function canonicalFor(meta: SeoMeta) {
  return `${SITE_URL}${meta.path === "/" ? "" : meta.path}`;
}

function routeJsonLd(meta: SeoMeta): JsonLdObject {
  const canonical = canonicalFor(meta);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": meta.pageType ?? "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: meta.title,
        description: meta.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en-CA",
        ...(meta.mainEntity ? { mainEntity: meta.mainEntity } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "GrandePrairie.dev",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: meta.title.split("|")[0]?.trim() ?? meta.title,
            item: canonical,
          },
        ],
      },
    ],
  };
}

function replaceOrInsert(html: string, selector: RegExp, tag: string) {
  const updated = html.replace(selector, tag);
  if (updated !== html) return updated;
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function metaRegex(attribute: "name" | "property", value: string) {
  return new RegExp(`<meta\\s+[^>]*${attribute}="${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "i");
}

function applyHtmlSeo(html: string, meta: SeoMeta) {
  const canonical = canonicalFor(meta);
  const image = meta.image ?? DEFAULT_IMAGE;
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  let next = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(meta.title)}</title>`);

  const tags: Array<["name" | "property", string, string]> = [
    ["name", "description", `<meta name="description" content="${escapeAttribute(meta.description)}" />`],
    ["name", "keywords", `<meta name="keywords" content="${escapeAttribute(meta.keywords)}" />`],
    ["name", "robots", `<meta name="robots" content="${escapeAttribute(robots)}" />`],
    ["name", "gp-seo-source", '<meta name="gp-seo-source" content="dynamic" />'],
    ["name", "gp-seo-path", `<meta name="gp-seo-path" content="${escapeAttribute(meta.path)}" />`],
    ["property", "og:url", `<meta property="og:url" content="${escapeAttribute(canonical)}" />`],
    ["property", "og:title", `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`],
    ["property", "og:description", `<meta property="og:description" content="${escapeAttribute(meta.description)}" />`],
    ["property", "og:image", `<meta property="og:image" content="${escapeAttribute(image)}" />`],
    ["name", "twitter:title", `<meta name="twitter:title" content="${escapeAttribute(meta.title)}" />`],
    ["name", "twitter:description", `<meta name="twitter:description" content="${escapeAttribute(meta.description)}" />`],
    ["name", "twitter:image", `<meta name="twitter:image" content="${escapeAttribute(image)}" />`],
  ];

  for (const [attribute, value, tag] of tags) {
    next = replaceOrInsert(next, metaRegex(attribute, value), tag);
  }

  next = replaceOrInsert(
    next,
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
  );

  const routeScript = `<script id="route-json-ld" type="application/ld+json">${safeJson(routeJsonLd(meta))}</script>`;
  if (next.includes('id="route-json-ld"')) {
    return next.replace(/<script id="route-json-ld" type="application\/ld\+json">[\s\S]*?<\/script>/, routeScript);
  }
  return next.replace("</head>", `    ${routeScript}\n  </head>`);
}

async function dynamicSeoForPath(pathname: string, env: Env): Promise<SeoMeta | null> {
  const profileMatch = pathname.match(/^\/people\/(\d+)$/);
  if (profileMatch) {
    const profile = await env.DB.prepare(
      "SELECT id, name, title, role, bio, skills, avatar_url FROM profiles WHERE id = ?",
    ).bind(profileMatch[1]).first<{
      id: number;
      name: string;
      title: string | null;
      role: string | null;
      bio: string | null;
      skills: string | null;
      avatar_url: string | null;
    }>();

    if (!profile) return null;
    const skills = parseTags(profile.skills);
    const role = profile.title ?? profile.role ?? "GrandePrairie.dev community member";
    return {
      path: pathname,
      title: `${profile.name} | GrandePrairie.dev Community Profile`,
      description: truncate(profile.bio, `${profile.name} is a ${role} in the Grande Prairie and Peace Region builder community.`),
      keywords: [profile.name, role, "Grande Prairie developer", "Peace Region builder", ...skills].join(", "),
      pageType: "ProfilePage",
      image: profile.avatar_url ?? undefined,
      mainEntity: {
        "@type": "Person",
        name: profile.name,
        jobTitle: role,
        description: truncate(profile.bio, `${profile.name} is part of the GrandePrairie.dev community.`),
        knowsAbout: skills,
        url: `${SITE_URL}${pathname}`,
      },
    };
  }

  const ideaMatch = pathname.match(/^\/ideas\/(\d+)$/);
  if (ideaMatch) {
    const idea = await env.DB.prepare(
      "SELECT id, title, description, category, tags FROM ideas WHERE id = ?",
    ).bind(ideaMatch[1]).first<{
      id: number;
      title: string;
      description: string | null;
      category: string | null;
      tags: string | null;
    }>();

    if (!idea) return null;
    const tags = parseTags(idea.tags);
    return {
      path: pathname,
      title: `${idea.title} | Grande Prairie Tech Idea`,
      description: truncate(idea.description, "A community-submitted Grande Prairie technology idea with local builder opportunity."),
      keywords: [idea.title, idea.category, "Grande Prairie tech idea", "Peace Region innovation", ...tags].filter(Boolean).join(", "),
      pageType: "CreativeWork",
      mainEntity: {
        "@type": "CreativeWork",
        name: idea.title,
        description: truncate(idea.description, "Grande Prairie technology idea"),
        about: tags,
        url: `${SITE_URL}${pathname}`,
      },
    };
  }

  const businessMatch = pathname.match(/^\/business\/(\d+)$/);
  if (businessMatch) {
    const request = await env.DB.prepare(
      "SELECT id, business_name, problem, category, status FROM business_requests WHERE id = ?",
    ).bind(businessMatch[1]).first<{
      id: number;
      business_name: string;
      problem: string;
      category: string | null;
      status: string | null;
    }>();

    if (!request) return null;
    return {
      path: pathname,
      title: `${request.business_name} Tech Request | GrandePrairie.dev`,
      description: truncate(request.problem, `${request.business_name} is looking for local Grande Prairie technology help.`),
      keywords: [request.business_name, request.category, "Grande Prairie business request", "small business automation", "local tech help"].filter(Boolean).join(", "),
      pageType: "WebPage",
      mainEntity: {
        "@type": "Project",
        name: `${request.business_name} technology request`,
        description: truncate(request.problem, "Grande Prairie business technology request"),
        projectStatus: request.status ?? "new",
        url: `${SITE_URL}${pathname}`,
      },
    };
  }

  const orgMatch = pathname.match(/^\/orgs\/([^/]+)$/);
  if (orgMatch) {
    const org = await env.DB.prepare(
      "SELECT slug, name, type, description, website_url, logo_url FROM organizations WHERE slug = ?",
    ).bind(decodeURIComponent(orgMatch[1] ?? "")).first<{
      slug: string;
      name: string;
      type: string | null;
      description: string | null;
      website_url: string | null;
      logo_url: string | null;
    }>();

    if (!org) return null;
    return {
      path: pathname,
      title: `${org.name} | Grande Prairie Organization Profile`,
      description: truncate(org.description, `${org.name} is part of the Grande Prairie technology and builder ecosystem.`),
      keywords: [org.name, org.type, "Grande Prairie organization", "Peace Region tech ecosystem", "local innovation"].filter(Boolean).join(", "),
      pageType: "AboutPage",
      image: org.logo_url ?? undefined,
      mainEntity: {
        "@type": "Organization",
        name: org.name,
        description: truncate(org.description, "Grande Prairie organization"),
        url: org.website_url ?? `${SITE_URL}${pathname}`,
      },
    };
  }

  if (/^\/people\/\d+\/edit$/.test(pathname) || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return {
      path: pathname,
      title: "Admin | GrandePrairie.dev",
      description: "Administrative tools for GrandePrairie.dev.",
      keywords: "GrandePrairie.dev admin",
      noindex: true,
    };
  }

  return null;
}

export async function applyDynamicHtmlSeo(request: Request, env: Env, response: Response) {
  if (request.method !== "GET") return response;

  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes(".") ||
    url.pathname === "/robots.txt" ||
    url.pathname === "/llms.txt"
  ) {
    return response;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const meta = await dynamicSeoForPath(url.pathname.replace(/\/$/, ""), env);
  if (!meta) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("Vary", "Accept");
  if (meta.noindex) headers.set("X-Robots-Tag", "noindex, nofollow");

  const html = await response.text();
  return new Response(applyHtmlSeo(html, meta), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

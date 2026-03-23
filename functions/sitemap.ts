interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const staticPages = [
    { loc: "https://grandeprairie.dev/", priority: "1.0", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/people", priority: "0.8", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/ideas", priority: "0.8", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/projects", priority: "0.7", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/map", priority: "0.7", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/calendar", priority: "0.8", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/intel", priority: "0.9", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/tech-hub", priority: "0.6", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/students", priority: "0.6", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/business", priority: "0.7", changefreq: "daily" },
    { loc: "https://grandeprairie.dev/#/ai-hub", priority: "0.6", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/orgs", priority: "0.6", changefreq: "weekly" },
    { loc: "https://grandeprairie.dev/#/about", priority: "0.5", changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

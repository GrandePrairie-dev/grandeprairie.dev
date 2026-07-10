import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const SITE_URL = "https://grandeprairie.dev";
const DEFAULT_IMAGE = `${SITE_URL}/images/hero-aurora.webp`;

const routes = [
  {
    path: "/",
    title: "GrandePrairie.dev | Grande Prairie Tech Community",
    description:
      "GrandePrairie.dev connects developers, trades workers, founders, students, and small businesses building technology in Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie tech community, Peace Region developers, Alberta builders, Northwestern Polytechnic tech",
    pageType: "WebPage",
  },
  {
    path: "/people",
    title: "People | Grande Prairie Developers, Builders, and Mentors",
    description:
      "Find developers, trades technologists, founders, students, operators, and mentors building the Grande Prairie technology ecosystem.",
    keywords: "Grande Prairie developers, Grande Prairie mentors, Peace Region tech workers, Northwestern Polytechnic students",
    pageType: "CollectionPage",
  },
  {
    path: "/ideas",
    title: "Ideas | Grande Prairie Tech Problems and Opportunities",
    description:
      "Browse and vote on practical technology ideas for Grande Prairie industries, small businesses, students, and builders.",
    keywords: "Grande Prairie startup ideas, Peace Region technology ideas, oil and gas automation, local business automation",
    pageType: "CollectionPage",
  },
  {
    path: "/projects",
    title: "Projects | Grande Prairie Builder Showcase",
    description:
      "Explore community-built software, AI, data, and industrial technology projects from Grande Prairie and Northwestern Alberta.",
    keywords: "Grande Prairie projects, Peace Region software, Alberta tech showcase, industrial technology projects",
    pageType: "CollectionPage",
  },
  {
    path: "/launches",
    title: "Launch Board | Grande Prairie Community Projects",
    description:
      "Discover and support new projects shipped by builders in Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie startups, Peace Region projects, local builders, community launch board",
    pageType: "CollectionPage",
  },
  {
    path: "/jobs",
    title: "Jobs & Gigs | Grande Prairie Tech Opportunities",
    description:
      "Find local technology jobs, contracts, internships, and co-founder opportunities in Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie tech jobs, Peace Region contracts, Grande Prairie internships, Alberta remote jobs",
    pageType: "CollectionPage",
  },
  {
    path: "/groups",
    title: "Community Groups | Grande Prairie Builders",
    description:
      "Find local groups for developers, founders, students, designers, AI builders, and cybersecurity practitioners in Grande Prairie.",
    keywords: "Grande Prairie tech groups, Grande Prairie developers, Peace Region founders, Grande Prairie AI community",
    pageType: "CollectionPage",
  },
  {
    path: "/map",
    title: "Map | Grande Prairie Tech and Builder Ecosystem",
    description:
      "Map the people, organizations, venues, and opportunities shaping the tech ecosystem around Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie tech map, Peace Region innovation map, Grande Prairie organizations",
    pageType: "WebPage",
  },
  {
    path: "/calendar",
    title: "Calendar | Grande Prairie Tech Events",
    description:
      "Find meetups, workshops, student events, founder sessions, and builder gatherings in Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie tech events, Grande Prairie meetups, Peace Region workshops, Northwestern Polytechnic events",
    pageType: "CollectionPage",
  },
  {
    path: "/board",
    title: "Message Board | Grande Prairie Builder Questions and Field Notes",
    description:
      "Ask for help, share job leads, coordinate events, and post field notes with builders across Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie message board, Peace Region builder forum, Grande Prairie job leads, local tech questions",
    pageType: "CollectionPage",
  },
  {
    path: "/business",
    title: "Small Business Requests | Find Grande Prairie Tech Help",
    description:
      "Grande Prairie businesses can post automation, website, data, and AI problems for local builders to help solve.",
    keywords: "Grande Prairie small business tech help, business automation Grande Prairie, local web developers Grande Prairie",
    pageType: "CollectionPage",
  },
  {
    path: "/intel",
    title: "Intel | Grande Prairie Tech and Innovation Signals",
    description:
      "Track regional technology, business, education, AI, and industry signals affecting builders in Grande Prairie and the Peace Region.",
    keywords: "Grande Prairie technology news, Peace Region innovation, Alberta AI news, Grande Prairie business intel",
    pageType: "CollectionPage",
  },
  {
    path: "/tech-hub",
    title: "Tech Hub | Grande Prairie Developer Resources",
    description:
      "Resources for software, AI, data, infrastructure, and industrial technology builders working in Grande Prairie and Northwestern Alberta.",
    keywords: "Grande Prairie tech resources, developer resources Alberta, Peace Region AI, industrial automation resources",
    pageType: "CollectionPage",
  },
  {
    path: "/students",
    title: "Students | Grande Prairie Tech Learning and Mentorship",
    description:
      "Student-friendly projects, mentorship, and career resources for Northwestern Polytechnic and emerging builders in Grande Prairie.",
    keywords: "Northwestern Polytechnic computer science, Grande Prairie students, student developer mentorship, NWP AI cloud data",
    pageType: "CollectionPage",
  },
  {
    path: "/ai-hub",
    title: "AI Hub | AI Use Cases for Grande Prairie Industries",
    description:
      "Practical AI use cases for Grande Prairie oil and gas, agriculture, forestry, construction, logistics, and small business operations.",
    keywords: "Grande Prairie AI, oil and gas AI Alberta, agriculture AI Peace Region, forestry automation Alberta",
    pageType: "CollectionPage",
  },
  {
    path: "/orgs",
    title: "Organizations | Grande Prairie Tech Ecosystem Directory",
    description:
      "Browse organizations, institutions, companies, and community groups supporting technology and builders in Grande Prairie.",
    keywords: "Grande Prairie organizations, Grande Prairie Chamber tech, Innovate Northwest, Northwestern Polytechnic",
    pageType: "CollectionPage",
  },
  {
    path: "/showcase",
    title: "Showcase | Grande Prairie Builder Stories",
    description:
      "See featured local organizations, projects, and builder stories from the Grande Prairie technology community.",
    keywords: "Grande Prairie showcase, Peace Region builders, local technology stories, Grande Prairie startups",
    pageType: "CollectionPage",
  },
  {
    path: "/about",
    title: "About | GrandePrairie.dev",
    description:
      "Learn how GrandePrairie.dev helps developers, trades workers, students, founders, and businesses build together in the Peace Region.",
    keywords: "about GrandePrairie.dev, Grande Prairie tech community, Peace Region builders",
    pageType: "AboutPage",
  },
  {
    path: "/agency",
    title: "GrandePrairie.dev Agency | Build, Run, and Show",
    description:
      "Build, run, and show practical digital systems for Grande Prairie businesses, organizations, and regional operators.",
    keywords: "Grande Prairie web agency, Grande Prairie software development, business automation Alberta",
    pageType: "WebPage",
  },
  {
    path: "/admin",
    title: "Admin | GrandePrairie.dev",
    description: "Administrative tools for GrandePrairie.dev.",
    keywords: "GrandePrairie.dev admin",
    pageType: "WebPage",
    noindex: true,
  },
];

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function canonicalFor(route) {
  return `${SITE_URL}${route.path === "/" ? "" : route.path}`;
}

function routeJsonLd(route) {
  const canonical = canonicalFor(route);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": route.pageType ?? "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: route.title,
        description: route.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: [
          { "@id": `${SITE_URL}/#organization` },
          { "@id": `${SITE_URL}/#place` },
        ],
        inLanguage: "en-CA",
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
          ...(route.path === "/"
            ? []
            : [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: route.title.split("|")[0].trim(),
                  item: canonical,
                },
              ]),
        ],
      },
    ],
  };
}

function replaceOrInsertMeta(html, selector, tag) {
  const nextTag = tag.trim();
  const updated = html.replace(selector, nextTag);
  if (updated !== html) return updated;
  return html.replace("</head>", `    ${nextTag}\n  </head>`);
}

function metaRegex(attribute, value) {
  return new RegExp(`<meta\\s+[^>]*${attribute}="${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "i");
}

function applySnapshot(html, route) {
  const canonical = canonicalFor(route);
  const image = route.image ?? DEFAULT_IMAGE;
  const robots = route.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  let next = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(route.title)}</title>`);

  const metaTags = [
    ["name", "description", `<meta name="description" content="${escapeAttribute(route.description)}" />`],
    ["name", "keywords", `<meta name="keywords" content="${escapeAttribute(route.keywords)}" />`],
    ["name", "robots", `<meta name="robots" content="${escapeAttribute(robots)}" />`],
    ["property", "og:url", `<meta property="og:url" content="${escapeAttribute(canonical)}" />`],
    ["property", "og:title", `<meta property="og:title" content="${escapeAttribute(route.title)}" />`],
    ["property", "og:description", `<meta property="og:description" content="${escapeAttribute(route.description)}" />`],
    ["property", "og:image", `<meta property="og:image" content="${escapeAttribute(image)}" />`],
    ["name", "twitter:title", `<meta name="twitter:title" content="${escapeAttribute(route.title)}" />`],
    ["name", "twitter:description", `<meta name="twitter:description" content="${escapeAttribute(route.description)}" />`],
    ["name", "twitter:image", `<meta name="twitter:image" content="${escapeAttribute(image)}" />`],
  ];

  for (const [attribute, value, tag] of metaTags) {
    next = replaceOrInsertMeta(next, metaRegex(attribute, value), tag);
  }

  next = replaceOrInsertMeta(
    next,
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
  );

  const routeScript = `<script id="route-json-ld" type="application/ld+json">${safeJson(routeJsonLd(route))}</script>`;
  if (next.includes('id="route-json-ld"')) {
    next = next.replace(/<script id="route-json-ld" type="application\/ld\+json">[\s\S]*?<\/script>/, routeScript);
  } else {
    next = next.replace("</head>", `    ${routeScript}\n  </head>`);
  }

  return next;
}

function outputPathFor(routePath) {
  if (routePath === "/") return path.join(DIST_DIR, "index.html");
  return path.join(DIST_DIR, routePath.slice(1), "index.html");
}

const sourceHtml = await readFile(path.join(DIST_DIR, "index.html"), "utf8");

for (const route of routes) {
  const html = applySnapshot(sourceHtml, route);
  const outPath = outputPathFor(route.path);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
}

console.log(`Generated SEO HTML snapshots for ${routes.length} routes.`);

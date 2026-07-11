const SITE_URL = "https://grandeprairie.dev";
const DEFAULT_IMAGE = `${SITE_URL}/images/hero-aurora.webp`;

type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[];

interface JsonLdObject {
  [key: string]: JsonLdValue;
}

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  noindex?: boolean;
  pageType?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";
}

const ROUTE_SEO: RouteSeo[] = [
  {
    path: "/launches",
    title: "Launch Board | Grande Prairie Community Projects",
    description:
      "Discover and support new projects shipped by builders in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie startups", "Peace Region projects", "local builders", "community launch board"],
    pageType: "CollectionPage",
  },
  {
    path: "/jobs",
    title: "Jobs & Gigs | Grande Prairie Tech Opportunities",
    description:
      "Find local technology jobs, contracts, internships, and co-founder opportunities in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie tech jobs", "Peace Region contracts", "Grande Prairie internships", "Alberta remote jobs"],
    pageType: "CollectionPage",
  },
  {
    path: "/groups",
    title: "Community Groups | Grande Prairie Builders",
    description:
      "Find local groups for developers, founders, students, designers, AI builders, and cybersecurity practitioners in Grande Prairie.",
    keywords: ["Grande Prairie tech groups", "Grande Prairie developers", "Peace Region founders", "Grande Prairie AI community"],
    pageType: "CollectionPage",
  },
  {
    path: "/mentorship",
    title: "Mentorship | Grande Prairie Builders",
    description:
      "Find an available local mentor or route a technical question to experienced builders in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie mentors", "Peace Region mentorship", "developer mentor Grande Prairie", "startup mentor Alberta"],
    pageType: "CollectionPage",
  },
  {
    path: "/",
    title: "GrandePrairie.dev | Grande Prairie Tech Community",
    description:
      "GrandePrairie.dev connects developers, trades workers, founders, students, and small businesses building technology in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie tech community", "Peace Region developers", "Alberta builders", "Northwestern Polytechnic tech"],
    pageType: "WebPage",
  },
  {
    path: "/people",
    title: "People | Grande Prairie Developers, Builders, and Mentors",
    description:
      "Find developers, trades technologists, founders, students, operators, and mentors building the Grande Prairie technology ecosystem.",
    keywords: ["Grande Prairie developers", "Grande Prairie mentors", "Peace Region tech workers", "Northwestern Polytechnic students"],
    pageType: "CollectionPage",
  },
  {
    path: "/ideas",
    title: "Ideas | Grande Prairie Tech Problems and Opportunities",
    description:
      "Browse and vote on practical technology ideas for Grande Prairie industries, small businesses, students, and builders.",
    keywords: ["Grande Prairie startup ideas", "Peace Region technology ideas", "oil and gas automation", "local business automation"],
    pageType: "CollectionPage",
  },
  {
    path: "/projects",
    title: "Projects | Grande Prairie Builder Showcase",
    description:
      "Explore community-built software, AI, data, and industrial technology projects from Grande Prairie and Northwestern Alberta.",
    keywords: ["Grande Prairie projects", "Peace Region software", "Alberta tech showcase", "industrial technology projects"],
    pageType: "CollectionPage",
  },
  {
    path: "/map",
    title: "Map | Grande Prairie Tech and Builder Ecosystem",
    description:
      "Map the people, organizations, venues, and opportunities shaping the tech ecosystem around Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie tech map", "Peace Region innovation map", "Grande Prairie organizations"],
    pageType: "WebPage",
  },
  {
    path: "/calendar",
    title: "Calendar | Grande Prairie Tech Events",
    description:
      "Find meetups, workshops, student events, founder sessions, and builder gatherings in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie tech events", "Grande Prairie meetups", "Peace Region workshops", "Northwestern Polytechnic events"],
    pageType: "CollectionPage",
  },
  {
    path: "/board",
    title: "Message Board | Grande Prairie Builder Questions and Field Notes",
    description:
      "Ask for help, share job leads, coordinate events, and post field notes with builders across Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie message board", "Peace Region builder forum", "Grande Prairie job leads", "local tech questions"],
    pageType: "CollectionPage",
  },
  {
    path: "/business",
    title: "Small Business Requests | Find Grande Prairie Tech Help",
    description:
      "Grande Prairie businesses can post automation, website, data, and AI problems for local builders to help solve.",
    keywords: ["Grande Prairie small business tech help", "business automation Grande Prairie", "local web developers Grande Prairie"],
    pageType: "CollectionPage",
  },
  {
    path: "/intel",
    title: "Intel | Grande Prairie Tech and Innovation Signals",
    description:
      "Track regional technology, business, education, AI, and industry signals affecting builders in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie technology news", "Peace Region innovation", "Alberta AI news", "Grande Prairie business intel"],
    pageType: "CollectionPage",
  },
  {
    path: "/tech-hub",
    title: "Tech Hub | Grande Prairie Developer Resources",
    description:
      "Resources for software, AI, data, infrastructure, and industrial technology builders working in Grande Prairie and Northwestern Alberta.",
    keywords: ["Grande Prairie tech resources", "developer resources Alberta", "Peace Region AI", "industrial automation resources"],
    pageType: "CollectionPage",
  },
  {
    path: "/students",
    title: "Students | Grande Prairie Tech Learning and Mentorship",
    description:
      "Student-friendly projects, mentorship, and career resources for Northwestern Polytechnic and emerging builders in Grande Prairie.",
    keywords: ["Northwestern Polytechnic computer science", "Grande Prairie students", "student developer mentorship", "NWP AI cloud data"],
    pageType: "CollectionPage",
  },
  {
    path: "/ai-hub",
    title: "AI Hub | AI Use Cases for Grande Prairie Industries",
    description:
      "Practical AI use cases for Grande Prairie oil and gas, agriculture, forestry, construction, logistics, and small business operations.",
    keywords: ["Grande Prairie AI", "oil and gas AI Alberta", "agriculture AI Peace Region", "forestry automation Alberta"],
    pageType: "CollectionPage",
  },
  {
    path: "/orgs",
    title: "Organizations | Grande Prairie Tech Ecosystem Directory",
    description:
      "Browse organizations, institutions, companies, and community groups supporting technology and builders in Grande Prairie.",
    keywords: ["Grande Prairie organizations", "Grande Prairie Chamber tech", "Innovate Northwest", "Northwestern Polytechnic"],
    pageType: "CollectionPage",
  },
  {
    path: "/showcase",
    title: "Showcase | Grande Prairie Builder Stories",
    description:
      "See featured local organizations, projects, and builder stories from the Grande Prairie technology community.",
    keywords: ["Grande Prairie showcase", "Peace Region builders", "local technology stories", "Grande Prairie startups"],
    pageType: "CollectionPage",
  },
  {
    path: "/about",
    title: "About | GrandePrairie.dev",
    description:
      "Learn how GrandePrairie.dev helps developers, trades workers, students, founders, and businesses build together in the Peace Region.",
    keywords: ["about GrandePrairie.dev", "Grande Prairie tech community", "Peace Region builders"],
    pageType: "AboutPage",
  },
  {
    path: "/conduct",
    title: "Community Conduct | GrandePrairie.dev",
    description: "Participation and moderation standards for the GrandePrairie.dev builder community.",
    keywords: ["GrandePrairie.dev conduct", "Grande Prairie tech community moderation"],
    pageType: "WebPage",
  },
  {
    path: "/digest",
    title: "Digest Preferences | GrandePrairie.dev",
    description: "Manage a GrandePrairie.dev weekly digest subscription.",
    keywords: ["GrandePrairie.dev digest"],
    noindex: true,
  },
  {
    path: "/agency",
    title: "GrandePrairie.dev Agency | Build, Run, and Show",
    description:
      "Build, run, and show practical digital systems for Grande Prairie businesses, organizations, and regional operators.",
    keywords: ["Grande Prairie web agency", "Grande Prairie software development", "business automation Alberta"],
    pageType: "WebPage",
  },
  {
    path: "/admin",
    title: "Admin | GrandePrairie.dev",
    description: "Administrative tools for GrandePrairie.dev.",
    keywords: ["GrandePrairie.dev admin"],
    noindex: true,
  },
];

function cleanPath(path: string) {
  const [pathname] = path.split(/[?#]/);
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/$/, "");
}

export function getSeoForPath(path: string): RouteSeo {
  const pathname = cleanPath(path);
  const exact = ROUTE_SEO.find((route) => route.path === pathname);
  if (exact) return exact;

  if (/^\/people\/[^/]+\/edit$/.test(pathname)) {
    return {
      path: pathname,
      title: "Edit Profile | GrandePrairie.dev",
      description: "Edit your GrandePrairie.dev community profile.",
      keywords: ["GrandePrairie.dev profile"],
      noindex: true,
    };
  }

  if (/^\/people\/[^/]+$/.test(pathname)) {
    return {
      path: pathname,
      title: "Community Profile | GrandePrairie.dev",
      description:
        "A GrandePrairie.dev community member profile for a builder, mentor, founder, student, or operator in the Peace Region.",
      keywords: ["Grande Prairie developer profile", "Peace Region builder", "GrandePrairie.dev member"],
      pageType: "WebPage",
    };
  }

  if (/^\/ideas\/[^/]+$/.test(pathname)) {
    return {
      path: pathname,
      title: "Tech Idea | GrandePrairie.dev",
      description:
        "A community-submitted Grande Prairie technology idea with local context, discussion, and builder opportunity.",
      keywords: ["Grande Prairie tech idea", "local innovation", "Peace Region builders"],
      pageType: "WebPage",
    };
  }

  if (/^\/business\/[^/]+$/.test(pathname)) {
    return {
      path: pathname,
      title: "Business Request | GrandePrairie.dev",
      description:
        "A Grande Prairie small business request seeking help from local builders with software, automation, data, or AI.",
      keywords: ["Grande Prairie business request", "small business automation", "local tech help"],
      pageType: "WebPage",
    };
  }

  if (/^\/orgs\/[^/]+$/.test(pathname)) {
    return {
      path: pathname,
      title: "Organization Profile | GrandePrairie.dev",
      description:
        "An organization profile in the Grande Prairie technology and builder ecosystem directory.",
      keywords: ["Grande Prairie organization", "Peace Region tech ecosystem", "local innovation"],
      pageType: "WebPage",
    };
  }

  return {
    path: pathname,
    title: "GrandePrairie.dev | Grande Prairie Tech Community",
    description:
      "GrandePrairie.dev connects developers, trades workers, founders, students, and small businesses building technology in Grande Prairie and the Peace Region.",
    keywords: ["Grande Prairie tech community", "Peace Region builders"],
    pageType: "WebPage",
  };
}

function setMeta(selector: string, attribute: "content" | "href", value: string) {
  const element = document.head.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

function setNamedMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setPropertyMeta(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function routeJsonLd(seo: RouteSeo): JsonLdObject {
  const canonical = `${SITE_URL}${seo.path === "/" ? "" : seo.path}`;
  const pageType = seo.pageType ?? "WebPage";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": pageType,
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: seo.title,
        description: seo.description,
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
          ...(seo.path === "/"
            ? []
            : [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: (seo.title.split("|")[0] ?? seo.title).trim(),
                  item: canonical,
                },
              ]),
        ],
      },
    ],
  };
}

export function applyRouteSeo(seo: RouteSeo) {
  const serverSeoSource = document.head.querySelector<HTMLMetaElement>('meta[name="gp-seo-source"]')?.content;
  const serverSeoPath = document.head.querySelector<HTMLMetaElement>('meta[name="gp-seo-path"]')?.content;
  if (serverSeoSource === "dynamic" && serverSeoPath === seo.path) {
    return;
  }

  const canonical = `${SITE_URL}${seo.path === "/" ? "" : seo.path}`;
  const image = seo.image ?? DEFAULT_IMAGE;

  document.title = seo.title;
  setNamedMeta("description", seo.description);
  setNamedMeta("keywords", seo.keywords.join(", "));
  setNamedMeta("robots", seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  setNamedMeta("gp-seo-source", "client");
  setNamedMeta("gp-seo-path", seo.path);
  setPropertyMeta("og:url", canonical);
  setPropertyMeta("og:title", seo.title);
  setPropertyMeta("og:description", seo.description);
  setPropertyMeta("og:image", image);
  setNamedMeta("twitter:title", seo.title);
  setNamedMeta("twitter:description", seo.description);
  setNamedMeta("twitter:image", image);
  setMeta('link[rel="canonical"]', "href", canonical);

  let script = document.head.querySelector<HTMLScriptElement>("#route-json-ld");
  if (!script) {
    script = document.createElement("script");
    script.id = "route-json-ld";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(routeJsonLd(seo));
}

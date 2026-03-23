export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

export interface FeedSource {
  name: string;
  url: string;
  defaultCategory: string;
}

export const RSS_SOURCES: FeedSource[] = [
  {
    name: "My Grande Prairie Now",
    url: "https://www.mygrandeprairienow.com/feed/",
    defaultCategory: "industry",
  },
  {
    name: "EverythingGP",
    url: "https://everythinggp.com/feed/",
    defaultCategory: "industry",
  },
  {
    name: "Grande Prairie Chamber of Commerce",
    url: "https://grandeprairiechamber.com/feed/",
    defaultCategory: "opportunity",
  },
  {
    name: "Alberta Innovates",
    url: "https://albertainnovates.ca/feed/",
    defaultCategory: "opportunity",
  },
];

function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  // Plain text
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const plainMatch = xml.match(plainRe);
  if (plainMatch) return plainMatch[1].trim();

  // Self-closing or attributes with href/url (for Atom links)
  if (tag === "link") {
    const hrefRe = /<link[^>]+href="([^"]+)"[^>]*\/?>/i;
    const hrefMatch = xml.match(hrefRe);
    if (hrefMatch) return hrefMatch[1].trim();
  }

  return "";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseItemBlocks(xml: string): string[] {
  const blocks: string[] = [];

  // RSS <item> blocks
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    blocks.push(match[1]);
  }

  if (blocks.length > 0) return blocks;

  // Atom <entry> blocks
  const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRe.exec(xml)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

function parsePubDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export async function fetchFeedItems(
  source: FeedSource,
  sinceHours = 24
): Promise<FeedItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "GrandePrairieDev-IntelBot/1.0 (+https://grandeprairie.dev)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      // Cloudflare Workers fetch — no timeout option, but the runtime enforces limits
    });

    if (!response.ok) {
      console.error(`[RSS] ${source.name}: HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const blocks = parseItemBlocks(xml);

    if (blocks.length === 0) {
      console.warn(`[RSS] ${source.name}: no items found in feed`);
      return [];
    }

    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const items: FeedItem[] = [];

    for (const block of blocks) {
      const rawTitle = decodeHtmlEntities(extractTag(block, "title"));
      const rawLink =
        extractTag(block, "link") ||
        extractTag(block, "guid") ||
        extractTag(block, "id");
      const rawDescription =
        decodeHtmlEntities(
          stripHtml(
            extractTag(block, "description") ||
              extractTag(block, "summary") ||
              extractTag(block, "content") ||
              extractTag(block, "content:encoded")
          )
        );
      const rawPubDate =
        extractTag(block, "pubDate") ||
        extractTag(block, "published") ||
        extractTag(block, "updated") ||
        extractTag(block, "dc:date");

      if (!rawTitle || !rawLink) continue;

      const pubDate = parsePubDate(rawPubDate);
      if (pubDate && pubDate < cutoff) continue;

      items.push({
        title: rawTitle,
        link: rawLink,
        description: rawDescription.slice(0, 500),
        pubDate: pubDate ? pubDate.toISOString() : new Date().toISOString(),
        source: source.name,
      });
    }

    return items;
  } catch (err) {
    console.error(`[RSS] ${source.name}: fetch error —`, err);
    return [];
  }
}

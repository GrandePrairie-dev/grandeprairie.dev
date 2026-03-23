import type { FeedItem } from "./rss";

export interface DraftedItem {
  title: string;
  body: string;
  category: string;
  tags: string[];
  relevant: boolean;
  sourceItem: FeedItem;
}

const GROQ_SYSTEM_PROMPT = `You write Intel posts for GrandePrairie.dev, a tech community platform in Grande Prairie, Alberta (Peace Region).

For each news item, produce a JSON object:
{ "title": "...", "body": "2-3 sentence summary", "category": "hiring|industry|opportunity|events|project_activity", "tags": ["tag1", "tag2"], "relevant": true|false }

Only mark relevant=true if the item has a DIRECT connection to:
- Grande Prairie, Peace Region, or Northern Alberta (must name-drop the region or a regional entity)
- Technology, trades-tech, oil & gas tech, agri-tech, forestry tech IN the Peace Region
- Post-secondary education in the region (NWP, GPRC)
- Startup/business development specifically in the Peace Region
- Well licensing, drilling activity, or pipeline projects in the Montney/Peace Region

REJECT generic national/provincial news that merely mentions Alberta without a regional connection.
REJECT national AI/tech news that could apply anywhere. Be concise and practical — no hype.`;

interface GroqDraft {
  title: string;
  body: string;
  category: string;
  tags: string[];
  relevant: boolean;
}

interface GroqResponseMessage {
  content: string;
}

interface GroqResponseChoice {
  message: GroqResponseMessage;
}

interface GroqResponse {
  choices: GroqResponseChoice[];
}

export async function draftIntelItems(
  apiKey: string,
  items: FeedItem[]
): Promise<DraftedItem[]> {
  if (items.length === 0) return [];

  const userContent = items
    .map((item, i) =>
      `Item ${i + 1}:
Title: ${item.title}
Source: ${item.source}
Link: ${item.link}
Description: ${item.description}`
    )
    .join("\n\n---\n\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: GROQ_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Process the following ${items.length} news items. Return a JSON array of ${items.length} objects, one per item, in the same order. Each object must follow the schema exactly.\n\n${userContent}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Groq] API error ${response.status}: ${errText}`);
      return [];
    }

    const data = (await response.json()) as GroqResponse;
    const raw = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[Groq] Failed to parse JSON response:", raw.slice(0, 200));
      return [];
    }

    // Support both { items: [...] } and [...] shapes
    let drafts: unknown[];
    if (Array.isArray(parsed)) {
      drafts = parsed;
    } else if (
      parsed !== null &&
      typeof parsed === "object" &&
      "items" in (parsed as Record<string, unknown>) &&
      Array.isArray((parsed as Record<string, unknown>).items)
    ) {
      drafts = (parsed as Record<string, unknown>).items as unknown[];
    } else {
      // Try to find the first array value in the object
      const obj = parsed as Record<string, unknown>;
      const arrayVal = Object.values(obj).find((v) => Array.isArray(v));
      drafts = Array.isArray(arrayVal) ? (arrayVal as unknown[]) : [];
    }

    const result: DraftedItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const draft = drafts[i] as GroqDraft | undefined;
      if (!draft || typeof draft !== "object") {
        // If Groq returned fewer items than expected, mark remainder as not relevant
        result.push({
          title: items[i].title,
          body: items[i].description,
          category: "industry",
          tags: [],
          relevant: false,
          sourceItem: items[i],
        });
        continue;
      }

      result.push({
        title: String(draft.title ?? items[i].title),
        body: String(draft.body ?? items[i].description),
        category: String(draft.category ?? "industry"),
        tags: Array.isArray(draft.tags) ? draft.tags.map(String) : [],
        relevant: draft.relevant === true,
        sourceItem: items[i],
      });
    }

    return result;
  } catch (err) {
    console.error("[Groq] Unexpected error:", err);
    return [];
  }
}

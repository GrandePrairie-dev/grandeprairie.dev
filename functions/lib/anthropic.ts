export interface QCResult {
  verdict: "accept" | "reject" | "edit";
  reason: string;
  editedBody?: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

interface QCResponse {
  verdict: "accept" | "reject" | "edit";
  reason: string;
  editedBody?: string;
}

export async function qcIntelItem(
  apiKey: string,
  title: string,
  body: string,
  category: string,
  sourceUrl: string
): Promise<QCResult> {
  const prompt = `You are a quality-control editor for GrandePrairie.dev, a tech community platform in Grande Prairie, Alberta.

Review the following Intel post draft and return a JSON object:
{ "verdict": "accept"|"reject"|"edit", "reason": "short explanation", "editedBody": "revised body if verdict=edit" }

Rules:
- accept: factually grounded, appropriate tone, correct category, clear regional relevance
- edit: content is relevant but body needs cleanup (too long, hype language, factual issue fixable by rewording); provide editedBody
- reject: no real regional connection, unverifiable claims, inappropriate content, or pure marketing fluff

Post to review:
Title: ${title}
Body: ${body}
Category: ${category}
Source URL: ${sourceUrl}

Return only the JSON object.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Anthropic QC] API error ${response.status}: ${errText}`);
      return { verdict: "reject", reason: `API error: ${response.status}` };
    }

    const data = (await response.json()) as AnthropicResponse;
    const rawText = data?.content?.[0]?.text ?? "";

    let parsed: QCResponse;
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(cleaned) as QCResponse;
    } catch {
      console.error("[Anthropic QC] Failed to parse response:", rawText.slice(0, 200));
      return { verdict: "reject", reason: "QC parse error" };
    }

    const verdict = parsed.verdict;
    if (verdict !== "accept" && verdict !== "reject" && verdict !== "edit") {
      return { verdict: "reject", reason: "invalid QC verdict" };
    }

    return {
      verdict,
      reason: String(parsed.reason ?? ""),
      editedBody: verdict === "edit" ? String(parsed.editedBody ?? body) : undefined,
    };
  } catch (err) {
    console.error("[Anthropic QC] Unexpected error:", err);
    return { verdict: "reject", reason: "QC exception" };
  }
}

import type { Env } from "../../lib/env";
import { RSS_SOURCES, fetchFeedItems } from "../../lib/rss";
import type { FeedItem } from "../../lib/rss";
import { draftIntelItems } from "../../lib/groq";
import { qcIntelItem } from "../../lib/anthropic";
import { notifySlack } from "../../lib/slack";

interface PipelineStats {
  sourcesChecked: number;
  itemsFetched: number;
  itemsDrafted: number;
  itemsAccepted: number;
  itemsRejected: number;
  rejectReasons: string[];
  durationMs: number;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // --- Auth check ---
  const secret = env.PIPELINE_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: "Pipeline secret not configured" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providedSecret = request.headers.get("X-Pipeline-Secret");
  if (providedSecret !== secret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startedAt = Date.now();
  const stats: PipelineStats = {
    sourcesChecked: 0,
    itemsFetched: 0,
    itemsDrafted: 0,
    itemsAccepted: 0,
    itemsRejected: 0,
    rejectReasons: [],
    durationMs: 0,
  };

  // --- 1. Fetch all RSS sources ---
  const allFeedItems: FeedItem[] = [];
  for (const source of RSS_SOURCES) {
    stats.sourcesChecked++;
    const items = await fetchFeedItems(source, 24);
    allFeedItems.push(...items);
  }
  stats.itemsFetched = allFeedItems.length;

  if (allFeedItems.length === 0) {
    stats.durationMs = Date.now() - startedAt;
    await logPipelineRun(env, stats);
    return Response.json({ ok: true, stats, message: "No feed items found" });
  }

  // --- 2. Deduplicate against existing intel ---
  const freshItems: FeedItem[] = [];
  for (const item of allFeedItems) {
    const existing = await env.DB.prepare(
      "SELECT id FROM intel WHERE source_url = ? OR title = ? LIMIT 1"
    )
      .bind(item.link, item.title)
      .first<{ id: number }>();

    if (!existing) {
      freshItems.push(item);
    }
  }

  if (freshItems.length === 0) {
    stats.durationMs = Date.now() - startedAt;
    await logPipelineRun(env, stats);
    return Response.json({ ok: true, stats, message: "All items already in DB" });
  }

  // --- 3. Draft with Groq ---
  if (!env.GROQ_API_KEY) {
    stats.durationMs = Date.now() - startedAt;
    await logPipelineRun(env, stats);
    return Response.json({
      ok: false,
      stats,
      message: "GROQ_API_KEY not configured — skipping drafting",
    });
  }

  const drafted = await draftIntelItems(env.GROQ_API_KEY, freshItems);
  const relevantDrafts = drafted.filter((d) => d.relevant);
  stats.itemsDrafted = relevantDrafts.length;

  if (relevantDrafts.length === 0) {
    stats.durationMs = Date.now() - startedAt;
    await logPipelineRun(env, stats);
    return Response.json({ ok: true, stats, message: "No relevant drafts from Groq" });
  }

  // --- 4 & 5. QC with Anthropic + Publish accepted items ---
  for (const draft of relevantDrafts) {
    let finalBody = draft.body;
    let accepted = false;

    if (env.ANTHROPIC_API_KEY) {
      const qc = await qcIntelItem(
        env.ANTHROPIC_API_KEY,
        draft.title,
        draft.body,
        draft.category,
        draft.sourceItem.link
      );

      if (qc.verdict === "reject") {
        stats.itemsRejected++;
        stats.rejectReasons.push(`"${draft.title.slice(0, 60)}": ${qc.reason}`);
        continue;
      }

      if (qc.verdict === "edit" && qc.editedBody) {
        finalBody = qc.editedBody;
      }

      accepted = true;
    } else {
      // No Anthropic key — accept all Groq drafts
      accepted = true;
    }

    if (accepted) {
      try {
        await env.DB.prepare(
          `INSERT INTO intel (title, body, category, source_url, author_id, is_automated, source_feed, tags, is_pinned, is_featured)
           VALUES (?, ?, ?, ?, NULL, 1, ?, ?, 0, 0)`
        )
          .bind(
            draft.title,
            finalBody,
            draft.category,
            draft.sourceItem.link,
            draft.sourceItem.source,
            JSON.stringify(draft.tags)
          )
          .run();

        stats.itemsAccepted++;
      } catch (err) {
        console.error("[Pipeline] DB insert error:", err);
        stats.itemsRejected++;
        stats.rejectReasons.push(`"${draft.title.slice(0, 60)}": DB insert failed`);
      }
    }
  }

  // --- 6. Log pipeline run ---
  stats.durationMs = Date.now() - startedAt;
  await logPipelineRun(env, stats);

  // --- 7. Send Slack summary ---
  const slackMsg =
    `*Intel Pipeline Run Complete*\n` +
    `Sources checked: ${stats.sourcesChecked} | Items fetched: ${stats.itemsFetched} | Fresh: ${freshItems.length}\n` +
    `Drafted: ${stats.itemsDrafted} | Accepted: ${stats.itemsAccepted} | Rejected: ${stats.itemsRejected}\n` +
    `Duration: ${(stats.durationMs / 1000).toFixed(1)}s`;

  await notifySlack(env, slackMsg);

  return Response.json({ ok: true, stats });
};

async function logPipelineRun(env: Env, stats: PipelineStats): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO pipeline_runs
         (run_date, sources_checked, items_fetched, items_drafted, items_accepted, items_rejected, reject_reasons, duration_ms)
       VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        stats.sourcesChecked,
        stats.itemsFetched,
        stats.itemsDrafted,
        stats.itemsAccepted,
        stats.itemsRejected,
        JSON.stringify(stats.rejectReasons),
        stats.durationMs
      )
      .run();
  } catch (err) {
    console.error("[Pipeline] Failed to log run:", err);
  }
}

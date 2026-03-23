import type { Env } from "./env";

export async function notifySlack(env: Env, text: string): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    console.error("Slack webhook failed (non-blocking)");
  }
}

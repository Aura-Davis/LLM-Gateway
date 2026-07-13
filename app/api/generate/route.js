import { NextResponse } from "next/server";
import { resolveTier } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { callModel } from "@/lib/model";
import { logRequest } from "@/lib/metrics";
import { PriorityQueue, PRIORITY } from "@/lib/queue";

async function handleSingle(prompt, apiKey, tier) {
  const rl = await checkRateLimit(apiKey, tier);
  if (!rl.allowed) {
    await logRequest({ tier, rateLimited: true });
    return { status: 429, body: { error: "Rate limit exceeded", ...rl } };
  }

  const cached = await getCachedResponse(prompt, "gemini-flash-latest");
  if (cached) {
    await logRequest({ tier, cacheHit: true, latencyMs: 0 });
    return { status: 200, body: { text: cached, cached: true } };
  }

  try {
    const { text, latencyMs, model } = await callModel(prompt);
    await setCachedResponse(prompt, model, text);
    await logRequest({ tier, cacheHit: false, latencyMs });
    return { status: 200, body: { text, cached: false, latencyMs } };
  } catch (err) {
      console.error("Model call failed:", err.message);
      await logRequest({ tier, error: String(err.message || err) });
      return { status: 502, body: { error: "Model call failed", detail: err.message } };
  }
}

export async function POST(req) {
  const body = await req.json();
  const { apiKey, prompt, prompts } = body;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing apiKey" }, { status: 401 });
  }

  const tier = await resolveTier(apiKey);
  if (!tier) {
    return NextResponse.json({ error: "Invalid apiKey" }, { status: 401 });
  }

  if (Array.isArray(prompts) && prompts.length > 0) {
    const pq = new PriorityQueue();
    prompts.forEach((p) =>
      pq.enqueue(p, tier === "premium" ? PRIORITY.premium : PRIORITY.standard)
    );
    const ordered = pq.drainAll();

    const results = [];
    for (const p of ordered) {
      results.push(await handleSingle(p, apiKey, tier));
    }
    return NextResponse.json({ results: results.map((r) => r.body) });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const result = await handleSingle(prompt, apiKey, tier);
  return NextResponse.json(result.body, { status: result.status });
}

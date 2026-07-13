import { getDb } from "./mongodb";

export async function logRequest({
  tier,
  cacheHit,
  latencyMs,
  rateLimited,
  error,
}) {
  const db = await getDb();
  await db.collection("requestLog").insertOne({
    tier,
    cacheHit: !!cacheHit,
    rateLimited: !!rateLimited,
    error: error || null,
    latencyMs: latencyMs ?? null,
    ts: new Date(),
  });
}

export async function getRecentMetrics(limit = 200) {
  const db = await getDb();
  const events = await db
    .collection("requestLog")
    .find({})
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  const total = events.length;
  const cacheHits = events.filter((e) => e.cacheHit).length;
  const rateLimited = events.filter((e) => e.rateLimited).length;
  const errors = events.filter((e) => e.error).length;
  const latencies = events.filter((e) => e.latencyMs != null).map((e) => e.latencyMs);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  return {
    total,
    cacheHitRate: total ? +((cacheHits / total) * 100).toFixed(1) : 0,
    rateLimitedCount: rateLimited,
    errorCount: errors,
    avgLatencyMs: avgLatency,
    timeline: events
      .slice()
      .reverse()
      .map((e) => ({
        time: new Date(e.ts).toLocaleTimeString(),
        latencyMs: e.latencyMs ?? 0,
        cacheHit: e.cacheHit ? 1 : 0,
      })),
  };
}

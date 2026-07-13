import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiters;

function getLimiters() {
  if (limiters) return limiters;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  limiters = {
    standard: new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(5, "60 s", 10),
      analytics: true,
      prefix: "ratelimit:standard",
    }),
    premium: new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(20, "60 s", 40),
      analytics: true,
      prefix: "ratelimit:premium",
    }),
  };

  return limiters;
}

export async function checkRateLimit(apiKey, tier = "standard") {
  const { standard, premium } = getLimiters();
  const limiter = tier === "premium" ? premium : standard;
  const result = await limiter.limit(apiKey);
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    resetAt: result.reset,
  };
}

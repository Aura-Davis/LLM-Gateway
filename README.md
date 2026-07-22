# LLM Inference Gateway

A backend gateway that sits in front of an LLM API and adds the pieces a
production inference service actually needs: response caching,
rate limiting, and priority based request ordering plus a small live
dashboard to watch it work.

## Architecture

```
  
  client request -> /api/generate
   1. resolve tier      -> MongoDB (apiKeys)
   2. rate limit check  -> Upstash Redis (token bucket)
   3. cache lookup      -> MongoDB (cache, TTL index)
   4. [miss] call model -> Anthropic API
   5. log metrics       -> MongoDB (requestLog)

  dashboard -> /api/metrics  -> MongoDB (aggregates requestLog)
```

Batch requests { "prompts": [...] }
are ordered through a binary heap priority queue
(`lib/queue.js`) before dispatch, so premium tier batches are served
ahead of standard tier ones.

### Why MongoDB *and* Upstash, not just one

- **MongoDB** response cache (TTL index auto expires entries),
  request metrics log, and the API key/tier lookup. Mongo's
  TTL index handles cache expiry natively.
- **Upstash Redis** rate limiting only. It's REST based, so it doesn't
  need a persistent connection a real problem for MongoDB in
  serverless functions, which spin up fresh per request and can exhaust
  a connection pool fast without careful singleton handling Upstash also ships a purpose built
  token bucket rate limiter.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create accounts and get credentials

- **MongoDB Atlas** (free tier): [mongodb.com/atlas](https://www.mongodb.com/atlas) create a cluster and get your connection string
- **Upstash** (free tier): [upstash.com](https://upstash.com) create a Redis database and copy the REST URL and token
- **Gemini API key** (free): [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `MONGODB_URI`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
and `GEMINI_API_KEY`.

### 4. Seed the database

Creates the cache TTL index and two demo API keys (one per tier):

```bash
node -r dotenv/config scripts/seed.mjs dotenv_config_path=.env.local
```

(Or export the vars into your shell manually and run `node scripts/seed.mjs`.)

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard has a
"Try it" box wired to `/api/generate` using the two seeded demo keys.

## Tech stack

Next.js (App Router), MongoDB Atlas, Upstash Redis, Google Gemini API,
Recharts, deployed on Vercel

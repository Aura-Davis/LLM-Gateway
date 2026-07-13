import crypto from "crypto";
import { getDb } from "./mongodb";

const CACHE_TTL_SECONDS = 60 * 60 * 6;

function hashPrompt(prompt, model) {
  return crypto
    .createHash("sha256")
    .update(`${model}::${prompt}`)
    .digest("hex");
}

export async function ensureCacheIndexes() {
  const db = await getDb();
  await db
    .collection("cache")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("cache").createIndex({ promptHash: 1 }, { unique: true });
}

export async function getCachedResponse(prompt, model) {
  const db = await getDb();
  const promptHash = hashPrompt(prompt, model);
  const hit = await db.collection("cache").findOne({ promptHash });
  return hit ? hit.response : null;
}

export async function setCachedResponse(prompt, model, response) {
  const db = await getDb();
  const promptHash = hashPrompt(prompt, model);
  const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000);

  await db.collection("cache").updateOne(
    { promptHash },
    {
      $set: {
        promptHash,
        model,
        response,
        expiresAt,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export { hashPrompt };

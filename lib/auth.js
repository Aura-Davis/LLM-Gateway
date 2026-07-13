import { getDb } from "./mongodb";

export async function resolveTier(apiKey) {
  if (!apiKey) return null;
  const db = await getDb();
  const record = await db.collection("apiKeys").findOne({ key: apiKey });
  return record ? record.tier : null;
}

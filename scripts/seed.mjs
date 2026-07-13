import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Set MONGODB_URI before running this script.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "llm_gateway";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection("cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("cache").createIndex({ promptHash: 1 }, { unique: true });
  console.log("Cache indexes created.");

  await db.collection("apiKeys").updateOne(
    { key: "demo-standard-key" },
    { $set: { key: "demo-standard-key", tier: "standard", label: "demo" } },
    { upsert: true }
  );
  await db.collection("apiKeys").updateOne(
    { key: "demo-premium-key" },
    { $set: { key: "demo-premium-key", tier: "premium", label: "demo" } },
    { upsert: true }
  );
  console.log("Demo API keys seeded: demo-standard-key, demo-premium-key");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

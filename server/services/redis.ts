import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
  if (!redisUrl) return null;
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
  });
  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
  return redis;
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  const data = await client.get(key);
  if (!data) return null;
  try { return JSON.parse(data) as T; } catch { return null; }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 60): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(key);
}
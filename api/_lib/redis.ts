import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** Lazily creates the shared Upstash Redis client from env vars. */
export function getRedis(): Redis {
  if (client) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing KV_REST_API_URL / KV_REST_API_TOKEN environment variables");
  }
  client = new Redis({ url, token });
  return client;
}

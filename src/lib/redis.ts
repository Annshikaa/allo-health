import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const IDEMPOTENCY_TTL = 60 * 60 * 24; // 24 hours in seconds

export const keys = {
  idempotency: (key: string) => `idempotency:${key}`,
  reservation: (id: string) => `reservation:${id}`,
};

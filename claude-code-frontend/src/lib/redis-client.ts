// Server-side only Redis client
import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

let redisClient: Redis | UpstashRedis | null = null;
let isLocal = false;

export function getRedisClient(): { client: Redis | UpstashRedis | null; isLocal: boolean } {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client can only be used server-side');
  }

  if (!redisClient) {
    try {
      // Try local Redis first
      if (process.env.REDIS_URL || process.env.REDIS_HOST || !process.env.UPSTASH_REDIS_REST_URL) {
        const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
        redisClient = new Redis(redisUrl);
        isLocal = true;
        console.log('Connected to local Redis at:', redisUrl);
      }
      // Fallback to Upstash if configured
      else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redisClient = new UpstashRedis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        isLocal = false;
        console.log('Connected to Upstash Redis');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
    }
  }

  return { client: redisClient, isLocal };
}
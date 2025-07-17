// Server-side only Redis client
import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

let redisClient: Redis | UpstashRedis | null = null;
let isLocal = false;

function validateRedisConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate local Redis configuration
  if (process.env.REDIS_URL) {
    const url = process.env.REDIS_URL;
    if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
      errors.push('REDIS_URL must start with redis:// or rediss://');
    }
    try {
      new URL(url);
    } catch {
      errors.push('REDIS_URL is not a valid URL');
    }
  }

  if (process.env.REDIS_HOST) {
    const host = process.env.REDIS_HOST;
    if (!host || host.trim().length === 0) {
      errors.push('REDIS_HOST cannot be empty');
    }
    // Basic hostname validation
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
      errors.push('REDIS_HOST contains invalid characters');
    }
  }

  if (process.env.REDIS_PORT) {
    const port = parseInt(process.env.REDIS_PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('REDIS_PORT must be a valid port number (1-65535)');
    }
  }

  // Validate Upstash configuration
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    if (!url.startsWith('https://')) {
      errors.push('UPSTASH_REDIS_REST_URL must start with https://');
    }
    try {
      new URL(url);
    } catch {
      errors.push('UPSTASH_REDIS_REST_URL is not a valid URL');
    }
  }

  if (process.env.UPSTASH_REDIS_REST_TOKEN) {
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!token || token.trim().length === 0) {
      errors.push('UPSTASH_REDIS_REST_TOKEN cannot be empty');
    }
    if (token.length < 32) {
      errors.push('UPSTASH_REDIS_REST_TOKEN appears to be too short');
    }
  }

  // Check for incomplete Upstash configuration
  if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_TOKEN) {
    errors.push('UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is set');
  }
  if (process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.UPSTASH_REDIS_REST_URL) {
    errors.push('UPSTASH_REDIS_REST_URL is required when UPSTASH_REDIS_REST_TOKEN is set');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getRedisClient(): { client: Redis | UpstashRedis | null; isLocal: boolean } {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client can only be used server-side');
  }

  if (!redisClient) {
    // Validate configuration before attempting connection
    const validation = validateRedisConfig();
    if (!validation.isValid) {
      console.warn('Redis configuration validation failed:', validation.errors);
      return { client: null, isLocal: false };
    }

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
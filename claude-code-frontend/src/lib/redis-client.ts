// Server-side only Redis client
import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

let redisClient: Redis | UpstashRedis | null = null;
let isLocal = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

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
    const port = Number.parseInt(process.env.REDIS_PORT, 10);
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateConnection(client: Redis | UpstashRedis): Promise<boolean> {
  try {
    if (client instanceof Redis) {
      await client.ping();
    } else {
      await client.ping();
    }
    return true;
  } catch {
    return false;
  }
}

async function initializeRedisWithRetry(): Promise<{ client: Redis | UpstashRedis | null; isLocal: boolean }> {
  // Validate configuration before attempting connection
  const validation = validateRedisConfig();
  if (!validation.isValid) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Redis configuration validation failed:', validation.errors);
    }
    return { client: null, isLocal: false };
  }

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      let client: Redis | UpstashRedis;
      let localConnection = false;

      // Try local Redis first
      if (process.env.REDIS_URL || process.env.REDIS_HOST || !process.env.UPSTASH_REDIS_REST_URL) {
        const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
        client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          retryDelayOnFailover: 100,
          connectTimeout: 5000,
          lazyConnect: true
        });
        localConnection = true;
        
        // Test the connection
        await client.connect();
        const isValid = await validateConnection(client);
        if (!isValid) {
          await client.disconnect();
          throw new Error('Connection validation failed');
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`Connected to local Redis at: ${redisUrl} (attempt ${attempt})`);
        }
      }
      // Fallback to Upstash if configured
      else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        client = new UpstashRedis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        localConnection = false;

        // Test the connection
        const isValid = await validateConnection(client);
        if (!isValid) {
          throw new Error('Connection validation failed');
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`Connected to Upstash Redis (attempt ${attempt})`);
        }
      } else {
        throw new Error('No Redis configuration available');
      }

      connectionAttempts = 0; // Reset on successful connection
      return { client, isLocal: localConnection };

    } catch (error) {
      connectionAttempts = attempt;
      
      if (attempt === MAX_RETRY_ATTEMPTS) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to initialize Redis after ${MAX_RETRY_ATTEMPTS} attempts:`, error);
        }
        break;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn(`Redis connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms:`, error);
      }
      
      await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
    }
  }

  return { client: null, isLocal: false };
}

export function getRedisClient(): { client: Redis | UpstashRedis | null; isLocal: boolean } {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client can only be used server-side');
  }

  if (!redisClient && connectionAttempts < MAX_RETRY_ATTEMPTS) {
    // For synchronous calls, we can't await, so we initialize in background
    // This is a limitation but prevents blocking the main thread
    initializeRedisWithRetry().then(result => {
      redisClient = result.client;
      isLocal = result.isLocal;
    }).catch(() => {
      // Silent catch since we already handle errors in initializeRedisWithRetry
    });
  }

  return { client: redisClient, isLocal };
}

// Export async version for explicit initialization
export async function initializeRedis(): Promise<{ client: Redis | UpstashRedis | null; isLocal: boolean }> {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client can only be used server-side');
  }

  if (!redisClient) {
    const result = await initializeRedisWithRetry();
    redisClient = result.client;
    isLocal = result.isLocal;
  }

  return { client: redisClient, isLocal };
}
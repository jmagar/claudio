import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Creates an in-memory rate limiter function for Next.js API requests based on the provided configuration.
 *
 * The returned function tracks the number of requests per client (by IP address or a custom key) within a specified time window, and enforces a maximum allowed number of requests. When the limit is reached, further requests are denied until the window resets.
 *
 * @returns A function that, given a NextRequest, returns an object indicating whether the request is allowed, how many requests remain in the current window, and the reset time in milliseconds since epoch.
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; remaining: number; resetTime: number } => {
    // Generate a key for this request (default: IP address)
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up expired entries
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(entryKey);
      }
    }
    
    // Get or create entry for this key
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }
    
    // Check if within limits
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }
    
    // Increment count and update store
    entry.count++;
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

/**
 * Rate limiter configurations for different endpoints
 */
export const claudeCodeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
});

export const claudeCodeStreamRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 20, // 20 streaming requests per minute (more resource intensive)
});
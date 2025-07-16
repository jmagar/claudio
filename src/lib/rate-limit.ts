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
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
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
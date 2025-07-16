/**
 * API-related type definitions
 */

// Streaming types
export interface StreamingState {
  loading: boolean;
  error: string | null;
  isTyping: boolean;
  retryAttempt: number;
  isRetrying: boolean;
}

export interface StreamingConfig {
  timeoutMs?: number;
  retryConfig?: Partial<RetryConfig>;
  preservePartialContent?: boolean;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  totalElapsed: number;
}

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: any) => string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Input validation
export interface ValidationConfig {
  maxPromptLength: number;
  maxCustomSystemPromptLength: number;
  maxTurns: number;
  minTurns: number;
  maxMcpServers: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
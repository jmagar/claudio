/**
 * Retry utilities with exponential backoff for resilient streaming connections
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // Add randomness to prevent thundering herd
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds max
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

export interface RetryAttempt {
  attempt: number;
  delay: number;
  totalElapsed: number;
}

export class ExponentialBackoff {
  private config: RetryConfig;
  private attempt = 0;
  private startTime = Date.now();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Calculates the delay for a specific attempt number without side effects
   */
  private calculateDelay(attemptNumber: number): number {
    if (attemptNumber >= this.config.maxRetries) {
      return -1; // No more retries
    }

    // Calculate exponential backoff delay
    const baseDelay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptNumber);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(baseDelay, this.config.maxDelayMs);
    
    // Add jitter to prevent thundering herd effect
    const jitter = cappedDelay * this.config.jitterFactor * (Math.random() - 0.5);
    const finalDelay = Math.max(0, cappedDelay + jitter);

    return finalDelay;
  }

  /**
   * Calculates the delay for the next retry attempt and increments the counter
   */
  getNextDelay(): number {
    const delay = this.calculateDelay(this.attempt);
    this.attempt++;
    return delay;
  }

  /**
   * Gets information about the current retry attempt
   */
  getCurrentAttempt(): RetryAttempt {
    return {
      attempt: this.attempt,
      delay: this.calculateDelay(this.attempt),
      totalElapsed: Date.now() - this.startTime,
    };
  }

  /**
   * Resets the retry state
   */
  reset(): void {
    this.attempt = 0;
    this.startTime = Date.now();
  }

  /**
   * Checks if more retries are available
   */
  canRetry(): boolean {
    return this.attempt < this.config.maxRetries;
  }

  /**
   * Gets the remaining retry attempts
   */
  getRemainingAttempts(): number {
    return Math.max(0, this.config.maxRetries - this.attempt);
  }
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors that are generally retryable
  const retryablePatterns = [
    /network/i,
    /connection/i,
    /timeout/i,
    /abort/i,
    /fetch/i,
    /failed to fetch/i,
    /load failed/i,
    /ERR_NETWORK/i,
    /ERR_INTERNET_DISCONNECTED/i,
    /ERR_CONNECTION_REFUSED/i,
    /ERR_CONNECTION_RESET/i,
    /ERR_CONNECTION_TIMED_OUT/i,
  ];

  // Check error message
  if (retryablePatterns.some(pattern => pattern.test(error.message))) {
    return true;
  }

  // Check for specific error types
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  // Don't retry authentication or validation errors
  const nonRetryablePatterns = [
    /auth/i,
    /unauthorized/i,
    /forbidden/i,
    /invalid/i,
    /bad request/i,
    /not found/i,
    /validation/i,
  ];

  if (nonRetryablePatterns.some(pattern => pattern.test(error.message))) {
    return false;
  }

  return false;
}

/**
 * Sleeps for the specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: RetryAttempt, error: Error) => void,
): Promise<T> {
  const backoff = new ExponentialBackoff(config);
  let lastError: Error;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // Check if we have retries left
      if (!backoff.canRetry()) {
        throw lastError;
      }

      const delay = backoff.getNextDelay();
      if (delay < 0) {
        throw lastError;
      }

      const attemptInfo = backoff.getCurrentAttempt();
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attemptInfo, lastError);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }
}
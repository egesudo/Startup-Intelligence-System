/**
 * Server-Side Exponential Backoff Retry Utility
 * 
 * Provides exponential backoff retries with full jitter and timeouts
 * for external LLM generation and upstream database operations.
 */

export interface ServerRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
  timeoutMs: number;
  retryOnStatus: number[];
  onRetry?: (attempt: number, error: any, nextDelayMs: number) => void;
  isRetryableError?: (error: any) => boolean;
}

export const DEFAULT_SERVER_RETRY_CONFIG: ServerRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitter: true,
  timeoutMs: 60000,
  retryOnStatus: [408, 429, 500, 502, 503, 504]
};

export function calculateBackoffDelay(
  attempt: number,
  config: Pick<ServerRetryConfig, 'initialDelayMs' | 'maxDelayMs' | 'backoffFactor' | 'jitter'>
): number {
  const { initialDelayMs, maxDelayMs, backoffFactor, jitter } = config;
  const exponential = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  const capped = Math.min(maxDelayMs, exponential);
  
  if (!jitter) return capped;
  const jitterValue = Math.random() * (capped * 0.3);
  return Math.min(maxDelayMs, capped + jitterValue);
}

export function isServerRetryable(
  error: any,
  config: Pick<ServerRetryConfig, 'retryOnStatus' | 'isRetryableError'>
): boolean {
  if (config.isRetryableError && config.isRetryableError(error)) {
    return true;
  }

  const statusCode = error?.status || error?.code || error?.statusCode;
  if (typeof statusCode === 'number' && config.retryOnStatus.includes(statusCode)) {
    return true;
  }

  const msg = (error?.message || String(error || '')).toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('network') ||
    msg.includes('deadline exceeded')
  ) {
    return true;
  }

  return false;
}

export async function retryWithExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  customConfig?: Partial<ServerRetryConfig>
): Promise<T> {
  const config: ServerRetryConfig = { ...DEFAULT_SERVER_RETRY_CONFIG, ...customConfig };
  let lastError: any = null;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      // Execute with timeout promise race
      let timeoutHandle: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Operation timed out after ${config.timeoutMs}ms`));
        }, config.timeoutMs);
      });

      const result = await Promise.race([
        operation(attempt),
        timeoutPromise
      ]);

      clearTimeout(timeoutHandle);
      return result;
    } catch (err: any) {
      lastError = err;

      const isLastAttempt = attempt > config.maxRetries;
      if (isLastAttempt || !isServerRetryable(err, config)) {
        throw err;
      }

      const nextDelayMs = calculateBackoffDelay(attempt, config);
      console.warn(
        `[ServerRetry] Attempt ${attempt}/${config.maxRetries} failed (${err?.message || err}). Retrying in ${Math.round(nextDelayMs)}ms...`
      );

      if (config.onRetry) {
        try {
          config.onRetry(attempt, err, nextDelayMs);
        } catch {
          // Ignore error in callback
        }
      }

      await new Promise((resolve) => setTimeout(resolve, nextDelayMs));
    }
  }

  throw lastError;
}

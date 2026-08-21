/**
 * Exponential Backoff Retry Utility for API & Report Generation Calls
 * 
 * Provides resilient network request execution with:
 * - Exponential backoff delay calculation: delay = min(maxDelay, initialDelay * (backoffFactor ^ attempt) + jitter)
 * - Automatic timeout handling using AbortController
 * - Comprehensive retryable status detection (408, 429, 500, 502, 503, 504)
 * - Transparent retry logging and progress callbacks
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial base delay in milliseconds (default: 1000ms) */
  initialDelayMs: number;
  /** Maximum delay cap in milliseconds (default: 10000ms) */
  maxDelayMs: number;
  /** Exponential multiplier (default: 2) */
  backoffFactor: number;
  /** Add randomized jitter to prevent thundering herd (default: true) */
  jitter: boolean;
  /** Per-attempt timeout in milliseconds (default: 45000ms) */
  timeoutMs: number;
  /** HTTP status codes that should trigger a retry */
  retryOnStatus: number[];
  /** Optional callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: Error | Response, nextDelayMs: number) => void;
  /** Optional custom predicate to determine if an error is retryable */
  isRetryableError?: (error: any) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitter: true,
  timeoutMs: 45000,
  retryOnStatus: [408, 429, 500, 502, 503, 504]
};

/**
 * Calculates exponential backoff delay with optional full jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Pick<RetryConfig, 'initialDelayMs' | 'maxDelayMs' | 'backoffFactor' | 'jitter'>
): number {
  const { initialDelayMs, maxDelayMs, backoffFactor, jitter } = config;
  const exponential = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  const capped = Math.min(maxDelayMs, exponential);
  
  if (!jitter) return capped;
  // Full jitter: uniformly distributed random delay between 0 and capped delay
  const jitterValue = Math.random() * (capped * 0.3);
  return Math.min(maxDelayMs, capped + jitterValue);
}

/**
 * Checks if a network error or status code is eligible for retry
 */
export function isRetryable(
  errorOrResponse: any,
  config: Pick<RetryConfig, 'retryOnStatus' | 'isRetryableError'>
): boolean {
  if (config.isRetryableError && config.isRetryableError(errorOrResponse)) {
    return true;
  }

  // If response object with status
  if (errorOrResponse && typeof errorOrResponse.status === 'number') {
    return config.retryOnStatus.includes(errorOrResponse.status);
  }

  if (errorOrResponse instanceof Error) {
    const msg = errorOrResponse.message.toLowerCase();
    const name = errorOrResponse.name;

    // Timeout or abort errors
    if (name === 'AbortError' || name === 'TimeoutError' || msg.includes('timeout') || msg.includes('timed out')) {
      return true;
    }

    // Network connection drop or fetch failures
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('load failed')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Executes a generic asynchronous operation with exponential backoff retries
 */
export async function retryWithExponentialBackoff<T>(
  operation: (attempt: number, signal?: AbortSignal) => Promise<T>,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...customConfig };
  let lastError: any = null;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    const controller = new AbortController();
    const timerId = setTimeout(() => {
      controller.abort(new Error(`Operation timed out after ${config.timeoutMs}ms`));
    }, config.timeoutMs);

    try {
      const result = await operation(attempt, controller.signal);
      clearTimeout(timerId);
      return result;
    } catch (err: any) {
      clearTimeout(timerId);
      lastError = err;

      const isLastAttempt = attempt > config.maxRetries;
      if (isLastAttempt || !isRetryable(err, config)) {
        throw err;
      }

      const nextDelayMs = calculateBackoffDelay(attempt, config);
      console.warn(
        `[RetryWithBackoff] Attempt ${attempt}/${config.maxRetries} failed: "${err?.message || err}". Retrying in ${Math.round(nextDelayMs)}ms...`
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

/**
 * Enhanced `fetch` wrapper with built-in exponential backoff and timeout handling.
 * Designed specifically for long-running report generation and synthesis endpoints.
 */
export async function fetchWithExponentialBackoff(
  input: RequestInfo | URL,
  init?: RequestInit,
  customConfig?: Partial<RetryConfig>
): Promise<Response> {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...customConfig };

  return retryWithExponentialBackoff(async (attempt, signal) => {
    // Merge caller signal with our timeout signal
    let combinedSignal: AbortSignal | undefined = signal;
    if (init?.signal) {
      if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal && typeof (AbortSignal as any).any === 'function') {
        combinedSignal = (AbortSignal as any).any([signal, init.signal]);
      } else {
        // Fallback: listen to init.signal if available
        init.signal.addEventListener('abort', () => {
          // Trigger signal abort
        });
      }
    }

    const mergedInit: RequestInit = {
      ...init,
      signal: combinedSignal
    };

    const response = await fetch(input, mergedInit);

    // If response is a retryable status code (e.g. 504 Gateway Timeout or 503 Unavailable)
    if (!response.ok && config.retryOnStatus.includes(response.status)) {
      const isLastAttempt = attempt > config.maxRetries;
      if (!isLastAttempt) {
        const errorText = await response.text().catch(() => '');
        const error = new Error(`HTTP ${response.status} (${response.statusText}): ${errorText.slice(0, 150)}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }
    }

    return response;
  }, config);
}

/**
 * Retry utility with exponential backoff
 */

import pRetry from "p-retry";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    onRetry = (error, attempt) => {
      console.warn(`Retry attempt ${attempt}: ${error.message}`);
    },
  } = options;

  return pRetry(fn, {
    retries: maxRetries,
    factor: 2, // Exponential backoff
    minTimeout: initialDelayMs,
    maxTimeout: maxDelayMs,
    onFailedAttempt: (error) => {
      onRetry(error, error.attemptNumber);
    },
  });
}


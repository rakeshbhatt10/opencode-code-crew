/**
 * Rate limiting and concurrency control
 */

import pLimit from "p-limit";

export class RateLimiter {
  private limiter: ReturnType<typeof pLimit>;

  constructor(concurrency: number) {
    this.limiter = pLimit(concurrency);
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter(fn);
  }

  get activeCount(): number {
    return this.limiter.activeCount;
  }

  get pendingCount(): number {
    return this.limiter.pendingCount;
  }

  clearQueue(): void {
    this.limiter.clearQueue();
  }
}

// Global limiters for different phases
export const planningLimiter = new RateLimiter(3); // 3 planning agents
export const implementationLimiter = new RateLimiter(3); // 3 workers


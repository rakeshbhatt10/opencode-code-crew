/**
 * Graceful shutdown handling
 */

type CleanupHandler = () => Promise<void> | void;

class ShutdownManager {
  private handlers: CleanupHandler[] = [];
  private isShuttingDown = false;

  constructor() {
    // Register signal handlers
    process.on("SIGINT", () => this.shutdown("SIGINT"));
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
      this.shutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled rejection:", reason);
      this.shutdown("unhandledRejection");
    });
  }

  registerCleanup(handler: CleanupHandler): void {
    this.handlers.push(handler);
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log(`\nReceived ${signal}, cleaning up...`);

    // Run all cleanup handlers
    for (const handler of this.handlers) {
      try {
        await handler();
      } catch (error) {
        console.error("Cleanup handler failed:", error);
      }
    }

    console.log("Cleanup complete, exiting.");
    process.exit(0);
  }
}

// Singleton instance
export const shutdownManager = new ShutdownManager();

/**
 * Register a cleanup handler to run on shutdown
 */
export function onShutdown(handler: CleanupHandler): void {
  shutdownManager.registerCleanup(handler);
}


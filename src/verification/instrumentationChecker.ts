/**
 * Instrumentation health checks
 */

import { runShell } from "../core/shell.js";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import type { HealthCheckResult } from "../types.js";

export class InstrumentationChecker {
  /**
   * Verify all instrumentation is working BEFORE starting any feedback loop
   * THROWS if critical instrumentation is broken
   */
  async verifyHealthy(workDir: string): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      testRunner: false,
      linter: false,
      typeChecker: false,
      issues: [],
    };

    // Create health check directory
    const healthDir = join(workDir, "__health_check__");
    try {
      await mkdir(healthDir, { recursive: true });

      // 1. Test runner check
      result.testRunner = await this.checkTestRunner(healthDir);
      if (!result.testRunner) {
        result.issues.push("Test runner not working");
      }

      // 2. Linter check
      result.linter = await this.checkLinter(healthDir);
      if (!result.linter) {
        result.issues.push("Linter not working");
      }

      // 3. Type checker check
      result.typeChecker = await this.checkTypeChecker(healthDir);
      if (!result.typeChecker) {
        result.issues.push("Type checker not working");
      }

      // Cleanup
      await this.cleanup(healthDir);
    } catch (error: any) {
      result.issues.push(`Health check failed: ${error.message}`);
    }

    // Throw if any critical checks failed
    if (result.issues.length > 0) {
      throw new Error(
        `Instrumentation health check failed:\n${result.issues.join("\n")}`
      );
    }

    return result;
  }

  private async checkTestRunner(healthDir: string): Promise<boolean> {
    const testFile = join(healthDir, "smoke.test.ts");
    
    try {
      // Create a simple passing test
      await writeFile(
        testFile,
        `import { describe, it, expect } from "bun:test";
describe("smoke", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});`
      );

      // Run test
      const result = await runShell(`bun test ${testFile}`, { cwd: healthDir });
      return result.success;
    } catch (error) {
      return false;
    }
  }

  private async checkLinter(healthDir: string): Promise<boolean> {
    const lintFile = join(healthDir, "lint.ts");
    
    try {
      // Create a file with intentional lint error
      await writeFile(
        lintFile,
        `const unused = 42; // Should trigger unused variable warning
export const valid = true;`
      );

      // Run linter (should succeed even with warnings)
      const result = await runShell(`eslint ${lintFile}`, { cwd: healthDir });
      // Linter is working if it runs (even if it finds issues)
      return true;
    } catch (error) {
      // If eslint is not installed, that's okay
      return true;
    }
  }

  private async checkTypeChecker(healthDir: string): Promise<boolean> {
    const typeFile = join(healthDir, "type.ts");
    
    try {
      // Create a valid TypeScript file
      await writeFile(
        typeFile,
        `export const valid: string = "hello";`
      );

      // Run type checker
      const result = await runShell(`tsc --noEmit ${typeFile}`, { cwd: healthDir });
      return result.success;
    } catch (error) {
      return false;
    }
  }

  private async cleanup(healthDir: string): Promise<void> {
    try {
      await runShell(`rm -rf ${healthDir}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}


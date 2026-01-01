/**
 * Shell command wrapper using Bun's $ command
 */

import { $ } from "bun";

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export async function runShell(
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string>;
    throwOnError?: boolean;
  } = {}
): Promise<ShellResult> {
  const { cwd = process.cwd(), env = {}, throwOnError = false } = options;

  try {
    const proc = await $`${command}`.cwd(cwd).env({ ...process.env, ...env }).quiet();
    
    return {
      stdout: proc.stdout?.toString() || "",
      stderr: proc.stderr?.toString() || "",
      exitCode: proc.exitCode || 0,
      success: (proc.exitCode || 0) === 0,
    };
  } catch (error: any) {
    const result: ShellResult = {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.exitCode || 1,
      success: false,
    };

    if (throwOnError) {
      throw new Error(`Command failed: ${command}\n${result.stderr}`);
    }

    return result;
  }
}

export async function runShellSafe(
  command: string,
  cwd?: string
): Promise<ShellResult> {
  return runShell(command, { cwd, throwOnError: false });
}

export async function runShellOrThrow(
  command: string,
  cwd?: string
): Promise<ShellResult> {
  return runShell(command, { cwd, throwOnError: true });
}


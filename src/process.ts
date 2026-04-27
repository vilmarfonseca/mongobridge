import { spawnSync } from "node:child_process";
import * as readline from "node:readline";

export function requireCmd(cmd: string): void {
  const finder = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(finder, [cmd], { stdio: "ignore" });
  if (r.status !== 0) {
    console.error(`Error: required command '${cmd}' not found in PATH.`);
    process.exit(1);
  }
}

export function run(cmd: string, args: string[]): number {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  return r.status ?? 1;
}

export function runOrExit(cmd: string, args: string[]): void {
  const status = run(cmd, args);
  if (status !== 0) process.exit(status);
}

export function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

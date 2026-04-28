#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { loadDotenv } from "./env";
import { parseArgs } from "./args";
import { dispatch } from "./commands";
import { registerTmpCleanup } from "./tmp";

function printVersionIfRequested(argv: string[]): boolean {
  if (!argv.includes("-v") && !argv.includes("--version")) return false;
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonRaw) as { version?: string };
  console.log(packageJson.version || "unknown");
  return true;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (printVersionIfRequested(argv)) return;
  registerTmpCleanup();
  loadDotenv();
  const opts = parseArgs(argv);
  await dispatch(opts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

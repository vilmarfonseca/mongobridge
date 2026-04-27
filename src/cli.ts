#!/usr/bin/env node
import { loadDotenv } from "./env";
import { parseArgs } from "./args";
import { dispatch } from "./commands";
import { registerTmpCleanup } from "./tmp";

async function main(): Promise<void> {
  registerTmpCleanup();
  loadDotenv();
  const opts = parseArgs(process.argv.slice(2));
  await dispatch(opts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

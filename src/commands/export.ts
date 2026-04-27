import * as fs from "node:fs";
import * as path from "node:path";
import { Options } from "../types";
import { resolveUriArg, uriWithoutDb } from "../uri";
import { requireCmd, run, runOrExit } from "../process";
import { timestampCompact, timestampPretty } from "../timestamp";

export async function cmdExport(o: Options): Promise<void> {
  requireCmd("mongodump");
  const fromUri = uriWithoutDb(resolveUriArg(o.from || "local"), o.db);
  const outDir = o.outDir ?? defaultOutDir(o);

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`mongodump → ${outDir} (db=${o.db})`);

  if (o.exportAll) {
    runOrExit("mongodump", [
      `--uri=${fromUri}`,
      `--db=${o.db}`,
      `--out=${outDir}`,
    ]);
  } else {
    if (o.collections.length === 0) {
      console.error(
        "Error: specify --all, -c/--collection, --collections, or --file.",
      );
      process.exit(1);
    }
    for (const c of o.collections) {
      console.log(`  dumping: ${c}`);
      run("mongodump", [
        `--uri=${fromUri}`,
        `--db=${o.db}`,
        `--collection=${c}`,
        `--out=${outDir}`,
      ]);
    }
  }
  console.log(`Export done: ${outDir}`);
}

function defaultOutDir(o: Options): string {
  const cwd = process.cwd();
  if (o.dumpMode) return path.join(cwd, `dump-${timestampPretty()}`);
  return path.join(
    cwd,
    `mongodb_exports_${timestampCompact()}_${o.db}_${o.tag}`,
  );
}

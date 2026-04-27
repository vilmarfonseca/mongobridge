import * as fs from "node:fs";
import * as path from "node:path";
import { Options } from "../types";
import { resolveUriArg, uriWithoutDb } from "../uri";
import { requireCmd, run, runOrExit } from "../process";

export async function cmdImport(o: Options): Promise<void> {
  requireCmd("mongorestore");
  const toUri = uriWithoutDb(resolveUriArg(o.to || "local"), o.db);

  if (
    !o.dumpDir ||
    !fs.existsSync(o.dumpDir) ||
    !fs.statSync(o.dumpDir).isDirectory()
  ) {
    console.error(`Error: dump directory not found: ${o.dumpDir}`);
    process.exit(1);
  }
  const dbpath = path.join(o.dumpDir, o.db);
  if (!fs.existsSync(dbpath) || !fs.statSync(dbpath).isDirectory()) {
    console.error(
      `Error: expected ${dbpath} (mongodump layout: <dir>/<db>/*.bson)`,
    );
    process.exit(1);
  }

  const dropFlag = o.dropBefore ? ["--drop"] : [];
  console.log(
    `mongorestore from ${o.dumpDir} (db=${o.db}${o.dropBefore ? ", --drop" : ""})`,
  );

  if (o.exportAll) {
    runOrExit("mongorestore", [`--uri=${toUri}`, ...dropFlag, o.dumpDir]);
  } else {
    if (o.collections.length === 0) {
      console.error(
        "Error: specify --all, -c/--collection, --collections, or --file.",
      );
      process.exit(1);
    }
    for (const c of o.collections) {
      const f = path.join(dbpath, `${c}.bson`);
      if (!fs.existsSync(f)) {
        console.log(`  skip (missing): ${c}`);
        continue;
      }
      console.log(`  restoring: ${c}`);
      run("mongorestore", [
        `--uri=${toUri}`,
        `--db=${o.db}`,
        `--collection=${c}`,
        ...dropFlag,
        f,
      ]);
    }
  }
  console.log("Import done.");
}

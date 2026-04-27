import { Options } from "../types";
import { resolveUriArg, uriWithoutDb } from "../uri";
import { requireCmd, run, runOrExit } from "../process";
import { makeTmp } from "../tmp";

export async function cmdPull(o: Options): Promise<void> {
  requireCmd("mongodump");
  requireCmd("mongorestore");
  const fromUri = uriWithoutDb(
    resolveUriArg(o.from || o.uri || "remote"),
    o.db,
  );
  const toUri = uriWithoutDb(resolveUriArg(o.to || "local"), o.db);

  const tmp = makeTmp();
  const dropFlag = o.dropBefore ? ["--drop"] : [];
  console.log(
    `Pull: database '${o.db}' (from '${o.from || "?"}' → to '${o.to || "?"}'${
      o.dropBefore ? ", --drop" : ""
    })`,
  );

  if (o.exportAll) {
    runOrExit("mongodump", [
      `--uri=${fromUri}`,
      `--db=${o.db}`,
      `--out=${tmp}`,
    ]);
    runOrExit("mongorestore", [`--uri=${toUri}`, ...dropFlag, tmp]);
  } else {
    if (o.collections.length === 0) {
      console.error(
        "Error: specify --all, -c/--collection, --collections, or --file.",
      );
      process.exit(1);
    }
    for (const c of o.collections) {
      console.log(`  pulling: ${c}`);
      run("mongodump", [
        `--uri=${fromUri}`,
        `--db=${o.db}`,
        `--collection=${c}`,
        `--out=${tmp}`,
      ]);
    }
    runOrExit("mongorestore", [`--uri=${toUri}`, ...dropFlag, tmp]);
  }
  console.log("Pull done.");
}

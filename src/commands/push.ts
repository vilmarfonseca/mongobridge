import { Options } from "../types";
import { resolveUriArg, uriWithoutDb } from "../uri";
import { requireCmd, run, runOrExit, ask } from "../process";
import { makeTmp } from "../tmp";

export async function cmdPush(o: Options): Promise<void> {
  requireCmd("mongodump");
  requireCmd("mongorestore");
  const fromUri = uriWithoutDb(resolveUriArg(o.from || "local"), o.db);
  const toUri = uriWithoutDb(resolveUriArg(o.to || o.uri || "remote"), o.db);

  if (!o.skipConfirm) {
    console.log(
      "This will overwrite data on the target for the selected scope.",
    );
    console.log(`  from: ${o.from || "?"}`);
    console.log(`  to:   ${o.to || "?"}`);
    console.log(`  db:   ${o.db}`);
    const ans = await ask("Type YES to continue: ");
    if (ans !== "YES") {
      console.log("Aborted.");
      process.exit(1);
    }
  }

  const tmp = makeTmp();
  const dropFlag = o.dropBefore ? ["--drop"] : [];
  console.log(
    `Push: database '${o.db}' (from '${o.from || "?"}' → to '${o.to || "?"}'${
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
      console.log(`  pushing: ${c}`);
      run("mongodump", [
        `--uri=${fromUri}`,
        `--db=${o.db}`,
        `--collection=${c}`,
        `--out=${tmp}`,
      ]);
    }
    runOrExit("mongorestore", [`--uri=${toUri}`, ...dropFlag, tmp]);
  }
  console.log("Push done.");
}

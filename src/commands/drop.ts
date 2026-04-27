import { Options } from "../types";
import { resolveUriArg, uriWithDb } from "../uri";
import { requireCmd, run, ask } from "../process";

export async function cmdDrop(o: Options): Promise<void> {
  requireCmd("mongosh");
  const full = uriWithDb(resolveUriArg(o.from || o.uri || "local"), o.db);

  if (o.collections.length === 0) {
    console.error(
      "Error: specify collections via -c, --collections, or --file.",
    );
    process.exit(1);
  }

  console.log(`Dropping on database '${o.db}' (profile: ${o.from || "?"}):`);
  for (const c of o.collections) console.log(`  - ${c}`);
  const ans = await ask("Type YES to drop: ");
  if (ans !== "YES") {
    console.log("Aborted.");
    process.exit(1);
  }

  for (const c of o.collections) {
    console.log(`Dropping: ${c}`);
    const safe = c.replace(/'/g, "\\'");
    run("mongosh", [
      full,
      "--quiet",
      "--eval",
      `db.getCollection('${safe}').drop()`,
    ]);
  }
  console.log("Drop done.");
}

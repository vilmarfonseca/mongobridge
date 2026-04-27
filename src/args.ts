import { Cmd, Options } from "./types";
import { getDbName } from "./env";
import { isMongoUri } from "./uri";
import { readCollectionsFile, expandCollections } from "./collections";
import { usage } from "./usage";

const VALID_CMDS = /^([^:]+):(pull|push|export|import|drop)$/;

export function parseArgs(argv: string[]): Options {
  if (argv.length === 0) {
    usage();
    process.exit(0);
  }
  if (argv[0] === "-h" || argv[0] === "--help") {
    usage();
    process.exit(0);
  }

  const m = argv[0].match(VALID_CMDS);
  if (!m) {
    console.error(
      `Unknown: ${argv[0]} (expected <profile>:pull|push|export|import|drop)`,
    );
    usage();
    process.exit(1);
  }
  const profile = m[1];
  const cmd = m[2] as Cmd;

  let { from, to } = defaultsForCmd(cmd, profile);
  let uri: string | undefined;

  const collectionArgs: string[] = [];
  let collectionsFile: string | undefined;
  let exportAll = false;
  let withVersions = false;
  let skipConfirm = false;
  let outDir: string | undefined;
  let dumpMode = false;
  let dropOverride: boolean | undefined;
  let noDrop = false;
  let dumpDir: string | undefined;

  for (let i = 1; i < argv.length; ) {
    const a = argv[i];
    switch (a) {
      case "-h":
      case "--help":
        usage();
        process.exit(0);
      case "--from":
        from = argv[++i];
        i++;
        break;
      case "--to":
        to = argv[++i];
        i++;
        break;
      case "--uri":
        uri = argv[++i];
        i++;
        break;
      case "-c":
      case "--collection":
        collectionArgs.push(argv[++i]);
        i++;
        break;
      case "--collections": {
        const csv = argv[++i];
        for (const p of csv.split(",")) {
          const t = p.trim();
          if (t) collectionArgs.push(t);
        }
        i++;
        break;
      }
      case "--file":
        collectionsFile = argv[++i];
        i++;
        break;
      case "--all":
        exportAll = true;
        i++;
        break;
      case "--with-versions":
        withVersions = true;
        i++;
        break;
      case "--out":
        outDir = argv[++i];
        i++;
        break;
      case "--yes":
        skipConfirm = true;
        i++;
        break;
      case "--drop":
        dropOverride = true;
        noDrop = false;
        i++;
        break;
      case "--no-drop":
        dropOverride = false;
        noDrop = true;
        i++;
        break;
      case "--dump":
        dumpMode = true;
        i++;
        break;
      default:
        if (cmd === "import" && !dumpDir) {
          dumpDir = a;
          i++;
        } else {
          console.error(
            `Unexpected argument: ${a} (database name must be set via MONGOBRIDGE_DB in .env)`,
          );
          process.exit(1);
        }
    }
  }

  if (uri) ({ from, to } = applyUriOverride(cmd, uri, from, to));

  const db = getDbName();
  if (!db) {
    console.error(
      "Error: set MONGOBRIDGE_DB in .env (or MONGOBRIDGE_DEFAULT_DB / MONGO_DB_NAME).",
    );
    process.exit(1);
  }

  if (cmd === "import" && !dumpDir) {
    console.error("Error: import requires <dump-dir>.");
    process.exit(1);
  }

  if (
    cmd === "pull" ||
    cmd === "push" ||
    cmd === "export" ||
    cmd === "import"
  ) {
    if (!exportAll && !collectionsFile && collectionArgs.length === 0) {
      exportAll = true;
    }
  }

  if (cmd === "drop") {
    if (exportAll) {
      console.error("Error: drop does not support --all.");
      process.exit(1);
    }
    if (!collectionsFile && collectionArgs.length === 0) {
      console.error("Error: drop requires collection names.");
      process.exit(1);
    }
  }

  let dropBefore: boolean;
  if (dropOverride !== undefined) dropBefore = dropOverride;
  else dropBefore = cmd === "pull" || cmd === "import";
  if (noDrop) dropBefore = false;

  let rawColls: string[] = [];
  if (collectionsFile) rawColls = readCollectionsFile(collectionsFile);
  else if (collectionArgs.length > 0) rawColls = collectionArgs;

  const collections = exportAll
    ? []
    : expandCollections(rawColls, withVersions);

  const tag = exportTag(cmd, from);

  return {
    cmd,
    from,
    to,
    uri,
    collectionArgs,
    collectionsFile,
    exportAll,
    withVersions,
    skipConfirm,
    outDir,
    dumpMode,
    dropBefore,
    dumpDir,
    db,
    collections,
    tag,
  };
}

function defaultsForCmd(
  cmd: Cmd,
  profile: string,
): { from?: string; to?: string } {
  switch (cmd) {
    case "pull":
      return { from: profile, to: "local" };
    case "push":
      return { from: "local", to: profile };
    case "export":
      return { from: profile };
    case "import":
      return { to: profile };
    case "drop":
      return { from: profile };
  }
}

function applyUriOverride(
  cmd: Cmd,
  uri: string,
  from: string | undefined,
  to: string | undefined,
): { from?: string; to?: string } {
  switch (cmd) {
    case "export":
      return { from: uri, to };
    case "import":
      return { from, to: uri };
    case "drop":
      return { from: uri, to };
    case "pull":
      console.error(
        "Error: use --from and --to with pull (or set defaults via env).",
      );
      process.exit(1);
    case "push":
      console.error(
        "Error: use --from and --to with push (or set defaults via env).",
      );
      process.exit(1);
  }
}

function exportTag(cmd: Cmd, from: string | undefined): string {
  if (cmd !== "export") return "export";
  if (!from) return "local";
  if (isMongoUri(from)) return "remote";
  return from;
}

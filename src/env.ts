import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as dotenv from "dotenv";

const MAX_PARENT_HOPS = 6;

export function loadDotenv(): void {
  let dir = process.cwd();
  for (let i = 0; i < MAX_PARENT_HOPS; i++) {
    const preferred = path.join(dir, ".env.mongobridge");
    if (fs.existsSync(preferred)) {
      dotenv.config({ path: preferred });
      return;
    }
    const fallback = path.join(dir, ".env");
    if (fs.existsSync(fallback)) {
      dotenv.config({ path: fallback });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const home = path.join(os.homedir(), ".mongobridge.env");
  if (fs.existsSync(home)) dotenv.config({ path: home });
}

export function resolveProfile(name: string): string | undefined {
  const env = process.env;
  switch (name.toLowerCase()) {
    case "local":
      return env.MONGO_LOCAL_URI;
    case "atlas":
    case "remote":
      return env.MONGO_ATLAS_URI || env.MONGO_REMOTE_URI;
    case "staging":
      return env.MONGO_STAGING_DB_URL;
    case "production":
      return env.MONGO_PRODUCTION_DB_URL;
    default:
      return undefined;
  }
}

export function getDbName(): string | undefined {
  return (
    process.env.MONGOBRIDGE_DB ||
    process.env.MONGOBRIDGE_DEFAULT_DB ||
    process.env.MONGO_DB_NAME
  );
}

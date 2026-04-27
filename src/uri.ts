import { resolveProfile } from "./env";

export function isMongoUri(s: string): boolean {
  return s.startsWith("mongodb://") || s.startsWith("mongodb+srv://");
}

export function uriWithoutDb(uri: string, db: string): string {
  uri = uri.replace(/\/$/, "");
  if (!db || !uri.includes(`/${db}`)) return uri;
  const queryIdx = uri.indexOf("?");
  const pathPart = queryIdx === -1 ? uri : uri.slice(0, queryIdx);
  const queryPart = queryIdx === -1 ? "" : uri.slice(queryIdx);
  const protoEnd = pathPart.indexOf("://");
  const lastSlash = pathPart.lastIndexOf("/");
  if (protoEnd !== -1 && lastSlash > protoEnd + 2) {
    return pathPart.slice(0, lastSlash) + queryPart;
  }
  return uri;
}

export function uriWithDb(uri: string, db: string): string {
  return `${uriWithoutDb(uri, db).replace(/\/$/, "")}/${db}`;
}

export function resolveUriArg(spec: string): string {
  if (isMongoUri(spec)) return spec;
  const u = resolveProfile(spec);
  if (!u) {
    console.error(
      `Error: unknown profile or empty URI for '${spec}'. Set the matching env var or pass a full URI.`,
    );
    process.exit(1);
  }
  return u;
}

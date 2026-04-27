import * as fs from "node:fs";

export function readCollectionsFile(file: string): string[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

export function expandCollections(
  base: string[],
  withVersions: boolean,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of base) {
    if (!seen.has(c)) {
      out.push(c);
      seen.add(c);
    }
    if (withVersions) {
      const v = `_${c}_versions`;
      if (!seen.has(v)) {
        out.push(v);
        seen.add(v);
      }
    }
  }
  return out;
}

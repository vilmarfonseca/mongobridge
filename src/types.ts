export type Cmd =
  | "pull"
  | "push"
  | "export"
  | "import"
  | "drop"
  | "generate:env";

export interface Options {
  cmd: Cmd;
  from?: string;
  to?: string;
  uri?: string;
  collectionArgs: string[];
  collectionsFile?: string;
  exportAll: boolean;
  withVersions: boolean;
  skipConfirm: boolean;
  outDir?: string;
  dumpMode: boolean;
  dropBefore: boolean;
  dumpDir?: string;
  db: string;
  collections: string[];
  tag: string;
}

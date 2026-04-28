import { Options } from "../types";
import { cmdExport } from "./export";
import { cmdImport } from "./import";
import { cmdPull } from "./pull";
import { cmdPush } from "./push";
import { cmdDrop } from "./drop";
import { cmdGenerateEnv } from "./generate-env";

export async function dispatch(opts: Options): Promise<void> {
  switch (opts.cmd) {
    case "export":
      return cmdExport(opts);
    case "import":
      return cmdImport(opts);
    case "pull":
      return cmdPull(opts);
    case "push":
      return cmdPush(opts);
    case "drop":
      return cmdDrop(opts);
    case "generate:env":
      return cmdGenerateEnv();
  }
}

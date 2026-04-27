import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string | null = null;

export function makeTmp(): string {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mongobridge."));
  return tmpDir;
}

export function cleanupTmp(): void {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  tmpDir = null;
}

export function registerTmpCleanup(): void {
  process.on("exit", cleanupTmp);
  process.on("SIGINT", () => {
    cleanupTmp();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanupTmp();
    process.exit(143);
  });
}

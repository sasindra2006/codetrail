import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (process.platform === "win32") {
  try {
    os.userInfo();
  } catch {
    os.userInfo = () => ({
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || "codetrail",
      homedir: process.env.USERPROFILE || process.cwd(),
      shell: null,
    });
  }
}

const packageEntry = fileURLToPath(import.meta.resolve("drizzle-kit"));
const drizzleCli = path.join(path.dirname(packageEntry), "bin.cjs");
process.argv[1] = drizzleCli;
await import(pathToFileURL(drizzleCli).href);

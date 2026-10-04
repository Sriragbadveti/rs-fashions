/**
 * Runs after `vite build`. With SENTRY_AUTH_TOKEN set (Vercel > Environment Variables) it uploads
 * the source maps to Sentry so error reports show real file names and lines. Either way the .map
 * files are deleted from dist/ so they are never published. This script never fails the build.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const token = process.env.SENTRY_AUTH_TOKEN;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

try {
  if (token) {
    const env = { ...process.env, SENTRY_URL: process.env.SENTRY_URL || "https://de.sentry.io" };
    const cli = fileURLToPath(new URL("../../node_modules/.bin/sentry-cli", import.meta.url));
    const args = ["--org", process.env.SENTRY_ORG || "personal-jr9", "--project", process.env.SENTRY_PROJECT || "rs-frontend"];
    execFileSync(cli, ["sourcemaps", "inject", dist], { stdio: "inherit", env });
    execFileSync(cli, ["sourcemaps", "upload", ...args, dist], { stdio: "inherit", env });
    console.log("[sentry] source maps uploaded");
  } else {
    console.log("[sentry] SENTRY_AUTH_TOKEN not set: skipping source map upload");
  }
} catch (err) {
  console.warn("[sentry] source map upload failed (build continues):", err?.message || err);
}

let removed = 0;
for (const file of walk(dist)) {
  if (file.endsWith(".map")) {
    rmSync(file);
    removed++;
  }
}
console.log(`[sentry] removed ${removed} source map file(s) from dist`);

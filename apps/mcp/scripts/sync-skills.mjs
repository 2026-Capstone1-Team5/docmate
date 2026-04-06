#!/usr/bin/env node
/**
 * Copy monorepo-root skills/ into apps/mcp/skills before npm pack/publish.
 * Invoked from package.json `sync-skills` and `prepack` (not from `build`, so published tarballs need no scripts/).
 * Canonical source: <repo>/skills
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const src = path.join(repoRoot, "skills");
const dest = path.join(packageRoot, "skills");

if (!fs.existsSync(src)) {
  console.error(`sync-skills: source not found: ${src}`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`sync-skills: ${src} -> ${dest}`);

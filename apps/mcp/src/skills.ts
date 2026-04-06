#!/usr/bin/env node
/**
 * document-agent-mcp skills
 * Standalone entry point: npx skills
 */
import { runSetup } from "./setup.js";

async function main() {
  await runSetup(process.argv.slice(2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

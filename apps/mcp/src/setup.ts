#!/usr/bin/env node
/**
 * document-agent-mcp setup
 * Cross-platform interactive setup: installs skills and registers MCP config.
 * Invoked via: document-agent-mcp setup
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// When installed via npm, __dirname is <package>/dist — package root is one level up
const PACKAGE_ROOT = path.resolve(__dirname, "..");

// ── Colours (no-op on dumb terminals) ────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  green: isTTY ? "\x1b[32m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  blue: isTTY ? "\x1b[34m" : "",
  red: isTTY ? "\x1b[31m" : "",
};

function ok(msg: string) {
  console.log(`  ${c.green}✔${c.reset} ${msg}`);
}
function warn(msg: string) {
  console.log(`  ${c.yellow}⚠${c.reset}  ${msg}`);
}
function err(msg: string) {
  console.error(`  ${c.red}✗${c.reset} ${msg}`);
}
function header(msg: string) {
  console.log(`\n${c.bold}${msg}${c.reset}`);
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ── Agent detection ───────────────────────────────────────────────────────────
type Agent = "claude" | "gemini" | "codex";

interface McpCommandConfig {
  command: string;
  args?: string[];
}

function hasCommand(cmd: string): boolean {
  const r = spawnSync(cmd, ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return r.status === 0 || r.error === undefined && r.status !== null;
}

function detectAgents(): Agent[] {
  const found: Agent[] = [];
  if (hasCommand("claude")) found.push("claude");
  if (hasCommand("gemini")) found.push("gemini");
  if (hasCommand("codex")) found.push("codex");
  return found;
}

// ── Path helpers ──────────────────────────────────────────────────────────────
const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "";

function srcSkillsDir(agent: Agent): string {
  return path.join(PACKAGE_ROOT, `.${agent}`, "skills");
}

function destSkillsDir(agent: Agent, target: string): string {
  return path.join(target, `.${agent}`, "skills");
}

function getMcpCommandConfig(): McpCommandConfig {
  const entryPath = path.resolve(process.argv[1] ?? path.join(PACKAGE_ROOT, "dist", "index.js"));
  return {
    command: process.execPath,
    args: [entryPath],
  };
}

// ── Skills installer ──────────────────────────────────────────────────────────
function installSkills(agent: Agent, target: string): boolean {
  const src = srcSkillsDir(agent);
  if (!fs.existsSync(src)) {
    warn(`Skills source not found: ${src}`);
    return false;
  }

  const dest = destSkillsDir(agent, target);
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillSrc = path.join(src, entry.name);
    const skillDest = path.join(dest, entry.name);
    fs.cpSync(skillSrc, skillDest, { recursive: true });
    ok(`skill: ${entry.name}`);
    count++;
  }
  console.log(`  ${c.blue}→${c.reset} ${count} skill(s) → ${c.bold}${dest}${c.reset}`);
  return true;
}

// ── MCP config helpers ────────────────────────────────────────────────────────
function writeMcpJson(
  jsonPath: string,
  apiKey: string,
  backendUrl: string,
  commandConfig: McpCommandConfig,
): boolean {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

  let config: Record<string, unknown> = {};
  if (fs.existsSync(jsonPath)) {
    try {
      config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch {
      err(`Could not parse existing ${jsonPath}. Refusing to overwrite it.`);
      return false;
    }
  }

  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    err(`Invalid MCP config root in ${jsonPath}. Expected a JSON object.`);
    return false;
  }

  const configWithServers = config as Record<string, unknown> & {
    mcpServers?: Record<string, unknown>;
  };

  if (
    configWithServers.mcpServers !== undefined &&
    (typeof configWithServers.mcpServers !== "object" ||
      configWithServers.mcpServers === null ||
      Array.isArray(configWithServers.mcpServers))
  ) {
    err(`Invalid mcpServers field in ${jsonPath}. Expected an object.`);
    return false;
  }

  configWithServers.mcpServers ??= {};
  configWithServers.mcpServers.docmate = {
    command: commandConfig.command,
    ...(commandConfig.args && commandConfig.args.length > 0
      ? { args: commandConfig.args }
      : {}),
    env: {
      DOCMATE_API_KEY: apiKey,
      DOCUMENT_AGENT_API_BASE_URL: backendUrl,
    },
  };

  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2) + "\n");
  ok(`MCP config → ${c.bold}${jsonPath}${c.reset}`);
  return true;
}

function writeCodexConfigToml(
  tomlPath: string,
  apiKey: string,
  backendUrl: string,
  commandConfig: McpCommandConfig,
): boolean {
  fs.mkdirSync(path.dirname(tomlPath), { recursive: true });

  let existing = "";
  if (fs.existsSync(tomlPath)) {
    existing = fs.readFileSync(tomlPath, "utf8");
  }

  const stripped = existing
    .replace(/^\[mcp_servers\.docmate\][\s\S]*?(?=^\[|\Z)/gm, "")
    .trimEnd();

  const escapedCommand = JSON.stringify(commandConfig.command);
  const escapedArgs = JSON.stringify(commandConfig.args ?? []);
  const escapedApiKey = JSON.stringify(apiKey);
  const escapedBackendUrl = JSON.stringify(backendUrl);

  const block = [
    "[mcp_servers.docmate]",
    `command = ${escapedCommand}`,
    `args = ${escapedArgs}`,
    "",
    "[mcp_servers.docmate.env]",
    `DOCMATE_API_KEY = ${escapedApiKey}`,
    `DOCUMENT_AGENT_API_BASE_URL = ${escapedBackendUrl}`,
    "",
  ].join("\n");

  const output = stripped ? `${stripped}\n\n${block}` : block;
  fs.writeFileSync(tomlPath, output);
  ok(`MCP config → ${c.bold}${tomlPath}${c.reset}`);
  return true;
}

function configureClaude(apiKey: string, backendUrl: string, target: string): boolean {
  const commandConfig = getMcpCommandConfig();
  if (target !== HOME) {
    return writeMcpJson(
      path.join(target, ".claude", ".mcp.json"),
      apiKey,
      backendUrl,
      commandConfig,
    );
  }

  // Try `claude mcp add` first for the default user-scoped install.
  const r = spawnSync(
    "claude",
    [
      "mcp", "add", "--scope", "user", "docmate",
      "-e", `DOCMATE_API_KEY=${apiKey}`,
      "-e", `DOCUMENT_AGENT_API_BASE_URL=${backendUrl}`,
      "--", commandConfig.command, ...(commandConfig.args ?? []),
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );

  if (r.status === 0) {
    ok("MCP server registered (user scope)");
    return true;
  } else {
    warn("claude mcp add failed — falling back to ~/.claude/.mcp.json");
    return writeMcpJson(
      path.join(HOME, ".claude", ".mcp.json"),
      apiKey,
      backendUrl,
      commandConfig,
    );
  }
}

function configureCodex(apiKey: string, backendUrl: string, target: string): boolean {
  const commandConfig = getMcpCommandConfig();

  if (target !== HOME) {
    return writeCodexConfigToml(
      path.join(target, ".codex", "config.toml"),
      apiKey,
      backendUrl,
      commandConfig,
    );
  }

  const args = [
    "mcp", "add", "docmate",
    "--env", `DOCMATE_API_KEY=${apiKey}`,
    "--env", `DOCUMENT_AGENT_API_BASE_URL=${backendUrl}`,
    "--",
    commandConfig.command,
    ...(commandConfig.args ?? []),
  ];

  const result = spawnSync(
    "codex",
    args,
    { stdio: "inherit", shell: process.platform === "win32" },
  );

  if (result.status === 0) {
    ok("MCP server registered for Codex");
    return true;
  }

  warn("codex mcp add failed — falling back to ~/.codex/config.toml");
  return writeCodexConfigToml(
    path.join(HOME, ".codex", "config.toml"),
    apiKey,
    backendUrl,
    commandConfig,
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function runSetup(args: string[]) {
  console.log(`\n${c.bold}DocMate MCP Setup${c.reset}`);
  console.log("─".repeat(40));

  // Parse --agent / --target flags
  const agentFlags: Agent[] = [];
  let target = HOME;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--agent" && args[i + 1]) {
      agentFlags.push(args[++i] as Agent);
    } else if (args[i] === "--target" && args[i + 1]) {
      target = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: document-agent-mcp setup [OPTIONS]

OPTIONS:
  --agent <name>    claude | gemini | codex  (repeatable)
  --target <path>   Install to a specific project directory (default: ~)
  --help            Show this message
`);
      process.exit(0);
    }
  }

  // ── Step 1: credentials ──────────────────────────────────────────────────
  header("[1/3] DocMate credentials");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let apiKey = "";
  while (!apiKey) {
    apiKey = (await prompt(rl, "  DOCMATE_API_KEY (required): ")).trim();
    if (!apiKey) err("API key cannot be empty.");
  }

  const rawUrl = (
    await prompt(rl, "  DOCUMENT_AGENT_API_BASE_URL [http://127.0.0.1:8000]: ")
  ).trim();
  const backendUrl = rawUrl || "http://127.0.0.1:8000";

  rl.close();

  // ── Step 2: detect agents ────────────────────────────────────────────────
  header("[2/3] Detecting agents");

  let agents: Agent[] = agentFlags.length > 0 ? agentFlags : detectAgents();

  if (agents.length === 0) {
    warn("No supported agents detected (claude, gemini, codex).");
    console.log("  Specify one manually:  document-agent-mcp setup --agent claude");
    process.exit(0);
  }

  console.log(`  Found: ${c.bold}${agents.join(", ")}${c.reset}`);

  // ── Step 3: install ──────────────────────────────────────────────────────
  header("[3/3] Installing skills & MCP config");
  const failures: string[] = [];

  for (const agent of agents) {
    console.log(`\n  ${c.blue}[${agent}]${c.reset}`);
    if (!installSkills(agent, target)) {
      failures.push(`${agent}:skills`);
    }

    if (agent === "claude") {
      if (!configureClaude(apiKey, backendUrl, target)) {
        failures.push(`${agent}:mcp`);
      }
    } else if (agent === "codex") {
      if (!configureCodex(apiKey, backendUrl, target)) {
        failures.push(`${agent}:mcp`);
      }
    } else {
      const jsonPath = path.join(target, `.${agent}`, ".mcp.json");
      if (!writeMcpJson(jsonPath, apiKey, backendUrl, getMcpCommandConfig())) {
        failures.push(`${agent}:mcp`);
      }
    }
  }

  if (failures.length > 0) {
    console.log(`\n${c.yellow}${c.bold}Completed with issues.${c.reset}`);
    console.log(`  Failed steps: ${failures.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n${c.green}${c.bold}Done!${c.reset} DocMate is ready.`);
  console.log(`  Start your agent and run ${c.bold}/mcp${c.reset} to verify the ${c.bold}docmate${c.reset} server is connected.\n`);
}

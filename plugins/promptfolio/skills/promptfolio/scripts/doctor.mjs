// Built from src/cli by esbuild. Do not edit; run `npm run build`.

// src/cli/doctor.ts
import fs2 from "node:fs";
import os from "node:os";

// src/browser.ts
import path from "node:path";
var WIN_CANDIDATES = [
  ["ProgramFiles(x86)", "Microsoft\\Edge\\Application\\msedge.exe"],
  ["ProgramFiles", "Microsoft\\Edge\\Application\\msedge.exe"],
  ["ProgramFiles", "Google\\Chrome\\Application\\chrome.exe"],
  ["ProgramFiles(x86)", "Google\\Chrome\\Application\\chrome.exe"],
  ["LOCALAPPDATA", "Google\\Chrome\\Application\\chrome.exe"],
  ["ProgramFiles", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"],
  ["LOCALAPPDATA", "Chromium\\Application\\chrome.exe"]
];
var MAC_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
];
var LINUX_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"];
function findBrowser(opts) {
  const { platform, env, exists } = opts;
  const candidates = [];
  if (env.PROMPTFOLIO_BROWSER) candidates.push(env.PROMPTFOLIO_BROWSER);
  if (platform === "win32") {
    for (const [v, rel] of WIN_CANDIDATES) if (env[v]) candidates.push(path.win32.join(env[v], rel));
  } else if (platform === "darwin") {
    candidates.push(...MAC_CANDIDATES);
  } else {
    const dirs = (env.PATH ?? "").split(path.posix.delimiter).filter(Boolean);
    for (const name of LINUX_NAMES) for (const dir of dirs) candidates.push(path.posix.join(dir, name));
  }
  return candidates.find(exists) ?? null;
}

// src/paths.ts
import path2 from "node:path";
function resolveClaudeDir(env, home) {
  return env.CLAUDE_CONFIG_DIR || path2.join(home, ".claude");
}

// src/sources/tooling.ts
import fs from "node:fs";
import path3 from "node:path";
async function entries(dir) {
  try {
    return await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
async function readTooling(claudeDir2) {
  let skills = 0;
  for (const e of await entries(path3.join(claudeDir2, "skills"))) {
    if (e.isDirectory() && fs.existsSync(path3.join(claudeDir2, "skills", e.name, "SKILL.md"))) skills++;
  }
  const agents = (await entries(path3.join(claudeDir2, "agents"))).filter((e) => e.isFile() && e.name.endsWith(".md")).length;
  let settings = {};
  try {
    settings = JSON.parse(await fs.promises.readFile(path3.join(claudeDir2, "settings.json"), "utf8")) ?? {};
  } catch {
  }
  let hooks = 0;
  if (settings.hooks && typeof settings.hooks === "object") {
    for (const groups of Object.values(settings.hooks)) {
      for (const g of Array.isArray(groups) ? groups : []) hooks += Array.isArray(g?.hooks) ? g.hooks.length : 0;
    }
  }
  const plugins = settings.enabledPlugins && typeof settings.enabledPlugins === "object" ? Object.values(settings.enabledPlugins).filter((v) => v === true).length : 0;
  const c = settings.cleanupPeriodDays;
  return { skills, agents, hooks, plugins, cleanupPeriodDays: typeof c === "number" && Number.isFinite(c) ? c : null };
}

// src/cli/doctor.ts
var claudeDir = resolveClaudeDir(process.env, os.homedir());
var claudeDirExists = fs2.existsSync(claudeDir);
var { cleanupPeriodDays } = claudeDirExists ? await readTooling(claudeDir) : { cleanupPeriodDays: null };
console.log(JSON.stringify({
  node: process.version,
  claudeDir,
  claudeDirExists,
  browser: findBrowser({ platform: process.platform, env: process.env, exists: fs2.existsSync }),
  cleanupPeriodDays
}, null, 2));

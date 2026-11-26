// Built from src/cli by esbuild. Do not edit; run `npm run build`.

// src/cli/doctor.ts
import fs3 from "node:fs";
import os from "node:os";
import path5 from "node:path";

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

// src/sources/history.ts
import path3 from "node:path";

// src/jsonl.ts
import fs from "node:fs";
import readline from "node:readline";
async function* readJsonl(file, counter = { bad: 0 }) {
  let input;
  if (typeof file === "string") {
    if (!fs.existsSync(file)) return;
    input = fs.createReadStream(file, { encoding: "utf8" });
  } else {
    input = file;
  }
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line);
      } catch {
        counter.bad++;
      }
    }
  } finally {
    rl.close();
    if ("destroy" in input && typeof input.destroy === "function") input.destroy();
  }
}

// src/text.ts
var NL = new Set("de het een ik je niet wat maar ook nog dat voor is dit zijn kan moet".split(" "));
var EN = new Set("the and is you not what but this that for are can should with".split(" "));

// src/sources/history.ts
async function listProjectNames(file) {
  const counts = /* @__PURE__ */ new Map();
  for await (const row of readJsonl(file)) {
    const p = row.project;
    if (typeof p !== "string" || !p) continue;
    const name = p.includes("\\") ? path3.win32.basename(p) : path3.posix.basename(p);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([name]) => name);
}

// src/sources/tooling.ts
import fs2 from "node:fs";
import path4 from "node:path";
async function entries(dir) {
  try {
    return await fs2.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
async function readTooling(claudeDir2) {
  let skills = 0;
  for (const e of await entries(path4.join(claudeDir2, "skills"))) {
    if (e.isDirectory() && fs2.existsSync(path4.join(claudeDir2, "skills", e.name, "SKILL.md"))) skills++;
  }
  const agents = (await entries(path4.join(claudeDir2, "agents"))).filter((e) => e.isFile() && e.name.endsWith(".md")).length;
  let settings = {};
  try {
    settings = JSON.parse(await fs2.promises.readFile(path4.join(claudeDir2, "settings.json"), "utf8")) ?? {};
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
var claudeDirExists = fs3.existsSync(claudeDir);
var { cleanupPeriodDays } = claudeDirExists ? await readTooling(claudeDir) : { cleanupPeriodDays: null };
var projects = process.argv.includes("--projects") && claudeDirExists ? await listProjectNames(path5.join(claudeDir, "history.jsonl")) : void 0;
console.log(JSON.stringify({
  node: process.version,
  claudeDir,
  claudeDirExists,
  browser: findBrowser({ platform: process.platform, env: process.env, exists: fs3.existsSync }),
  cleanupPeriodDays,
  ...projects ? { projects } : {}
}, null, 2));

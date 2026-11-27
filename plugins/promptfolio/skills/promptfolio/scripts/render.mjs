// Built from src/cli by esbuild. Do not edit; run `npm run build`.

// src/cli/render.ts
import fs3 from "node:fs";
import path3 from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// src/browser.ts
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
function fileUrl(p) {
  if (/^[A-Za-z]:[\\/]/.test(p)) {
    return "file:///" + encodeURI(p.replaceAll("\\", "/")).replaceAll("#", "%23").replaceAll("?", "%3F");
  }
  return pathToFileURL(p).href;
}
function screenshotArgs(opts) {
  return [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${opts.userDataDir}`,
    `--screenshot=${opts.outPng}`,
    `--window-size=${opts.width},${opts.height}`,
    "--virtual-time-budget=3000",
    fileUrl(opts.htmlPath)
  ];
}
function pngSize(buf) {
  const sig = "89504e470d0a1a0a";
  if (buf.length < 24 || buf.subarray(0, 8).toString("hex") !== sig) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
async function screenshot(opts) {
  const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "promptfolio-browser-"));
  try {
    await fs.promises.rm(opts.outPng, { force: true });
    await new Promise((resolve2, reject) => {
      execFile(
        opts.browser,
        screenshotArgs({ ...opts, userDataDir }),
        { timeout: opts.timeoutMs ?? 3e4, windowsHide: true },
        (err) => err ? reject(new Error(`Browser screenshot failed: ${err.message}`)) : resolve2()
      );
    });
    const size = fs.existsSync(opts.outPng) ? pngSize(await fs.promises.readFile(opts.outPng)) : null;
    if (!size) throw new Error(`Browser did not write a PNG to ${opts.outPng}`);
    if (size.width !== opts.width || size.height !== opts.height) {
      throw new Error(`PNG is ${size.width}x${size.height}, expected ${opts.width}x${opts.height}`);
    }
  } finally {
    await fs.promises.rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {
    });
  }
}

// src/redact.ts
var SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{8,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN/,
  /\beyJ[\w-]+\.[\w-]+\.[\w-]+/,
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s]+@/i,
  /\b[0-9a-fA-F]{32,}\b/
];
function looksRandom(text) {
  for (const run of text.match(/[A-Za-z0-9+/=_-]{40,}/g) ?? []) {
    if (/[A-Z]/.test(run) && /[a-z]/.test(run) && /[0-9]/.test(run)) return true;
  }
  return false;
}
function scanSecrets(text) {
  return SECRET_PATTERNS.some((re) => re.test(text)) || looksRandom(text);
}

// src/copy.ts
var COPY_LIMITS = { title: 22, line: 90, caption: 200 };
var RETIRED = ["profile", "persona", "diary", "awards", "relationship", "tokensLine", "verdict", "receiptFooter", "growthLine"];
var PLATFORMS = ["instagram", "linkedin", "x", "discord"];
var PLACEHOLDER_RE = /\{([A-Za-z0-9_.]+)\}/g;
function resolve(stats, path4) {
  let v = stats;
  for (const key of path4.split(".")) {
    if (v === null || v === void 0) return void 0;
    if (Array.isArray(v) && key === "length") v = v.length;
    else if (typeof v === "object" && Object.prototype.hasOwnProperty.call(v, key)) v = v[key];
    else return void 0;
  }
  return typeof v === "number" || typeof v === "string" ? v : void 0;
}
function format(path4, value) {
  if (typeof value === "string") {
    if (path4.endsWith(".month") && /^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
    }
    return value;
  }
  if (path4.endsWith("Share") && value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}
function fillPlaceholders(text, stats, _language = "en") {
  return text.replace(PLACEHOLDER_RE, (whole, path4) => {
    const v = resolve(stats, path4);
    return v === void 0 ? whole : format(path4, v);
  });
}
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function validateCopy(copy, stats) {
  const errors = [];
  if (!isObj(copy)) return { ok: false, errors: ["copy: must be a JSON object"] };
  const text = (path4, value, limit) => {
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${path4}: must be a non-empty string`);
      return;
    }
    for (const [, p] of value.matchAll(PLACEHOLDER_RE)) {
      if (resolve(stats, p) === void 0) errors.push(`${path4}: placeholder {${p}} does not resolve to a number or string in stats`);
    }
    if (/\d/.test(value.replace(PLACEHOLDER_RE, ""))) errors.push(`${path4}: contains a digit outside a placeholder; use a {placeholder}`);
    if (scanSecrets(value)) errors.push(`${path4}: looks like it contains a secret or personal data`);
    const filled = fillPlaceholders(value, stats);
    if (filled.length > COPY_LIMITS[limit]) errors.push(`${path4}: too long (${filled.length} > ${COPY_LIMITS[limit]} characters after filling)`);
  };
  if (copy.schemaVersion !== 2) errors.push("schemaVersion: must be 2");
  if (copy.language !== "en") errors.push('language: must be "en"');
  if (!["professional", "fun", "roast"].includes(copy.vibe)) errors.push('vibe: must be "professional", "fun" or "roast"');
  for (const k of RETIRED) if (k in copy) errors.push(`${k}: not used since copy v2`);
  text("title", copy.title, "title");
  const lines = isObj(copy.lines) ? copy.lines : {};
  if (!isObj(copy.lines)) errors.push("lines: must be an object with tokens, year, toolkit and growth");
  for (const k of ["tokens", "year", "toolkit"]) text(`lines.${k}`, lines[k], "line");
  if (stats.activity.byMonth.length >= 2 || lines.growth !== void 0) text("lines.growth", lines.growth, "line");
  const captions = isObj(copy.captions) ? copy.captions : {};
  if (!isObj(copy.captions)) errors.push("captions: must be an object with instagram, linkedin, x and discord");
  for (const k of PLATFORMS) text(`captions.${k}`, captions[k], "caption");
  return { ok: errors.length === 0, errors };
}

// src/render/brand.ts
var REPO = "github.com/Tiebe-Vaes/promptfolio";
var REPO_URL = `https://${REPO}`;

// src/render/captions.ts
var PLATFORMS2 = ["instagram", "linkedin", "x", "discord"];
var X_INTENT = "https://x.com/intent/tweet?text=";
function buildCaptions(copy, stats) {
  const out = {};
  for (const p of PLATFORMS2) {
    const text = `${fillPlaceholders(copy.captions[p], stats, copy.language)}

${REPO_URL}`;
    out[p] = p === "x" ? { text, intentUrl: X_INTENT + encodeURIComponent(text) } : { text };
  }
  return out;
}

// src/render/escape.ts
var ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
function fill(text, stats, _lang = "en") {
  return escapeHtml(fillPlaceholders(text, stats));
}
function num(n, _lang = "en", digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}
function compact(n, lang = "en") {
  const units = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, u] of units) if (n >= v) return `${num(n / v, lang, n / v < 100 ? 1 : 0)}${u}`;
  return num(n, lang);
}

// src/render/i18n.ts
var STRINGS = {
  en: {
    tokensRead: "tokens read",
    tokensWritten: "tokens written",
    activeDays: (n, f, from, to) => `${f} active day${n === 1 ? "" : "s"}, ${from} to ${to}`,
    sessions: "Sessions",
    messages: "Messages",
    bash: "Bash commands",
    testRuns: "Test runs",
    commits: "Commits",
    please: '"please"',
    noWait: '"no wait"',
    apiValue: "API value",
    youPaid: "You paid",
    aPlan: "a plan",
    excludes: (n) => `excl. ${n} unpriced model${n === 1 ? "" : "s"}`,
    apiNote: "Estimate at Anthropic API prices",
    receiptThanks: "Thank you for building.",
    receiptYear: (y) => `Claude Code, year ${y}`,
    busiestDay: "busiest day",
    streak: "longest streak",
    days: (n, f) => `${f} day${n === 1 ? "" : "s"}`,
    topLanguage: "top language",
    topTools: "top tools",
    verdict: "verdict",
    reading: (n, f) => `reading ${f} day${n === 1 ? "" : "s"} of logs...`,
    done: "done",
    msgs: "msgs",
    level: "LV",
    weakness: "Weakness",
    nemesis: "Nemesis",
    rarity: { common: "Common", rare: "Rare", legendary: "Legendary" },
    classLine: (lang, n, f, y) => `${lang} class. Summoned ${f} time${n === 1 ? "" : "s"} in ${y}.`,
    since: (d) => `since ${d}`,
    messagesPerMonth: "messages per month",
    save: "Save image",
    screenshot: "Screenshot this slide to share it",
    next: "Next",
    previous: "Previous",
    card: {
      tokens: "Tokens",
      year: "Year in numbers",
      toolkit: "Toolkit",
      growth: "Growth",
      tokensYear: "tokens this year",
      written: "tokens written",
      favorite: "favourite model",
      energy: "energy",
      water: "water",
      glasses: (f) => `${f} glasses`,
      estimate: "estimate",
      apiNote: "estimate at API prices",
      prompts: "Prompts",
      slash: "Slash commands",
      politeness: '"please" and "thanks"',
      toolCalls: "Tool calls",
      commits: "Commits",
      webSearches: "Web searches",
      subagents: "Subagents",
      filesEdited: "Files edited",
      apiValue: "API value",
      topTools: "top tools",
      languages: "Languages",
      topFirst: (l) => `${l} first`,
      setup: "Own setup",
      plugins: "Plugins",
      skills: (n, f) => `${f} skill${n === 1 ? "" : "s"}`,
      agents: (n, f) => `${f} agent${n === 1 ? "" : "s"}`,
      hooks: (n, f) => `${f} hook${n === 1 ? "" : "s"}`,
      busier: (from, to) => `busier in ${to} than in ${from}`,
      messagesYear: "messages this year",
      messages: "Messages",
      busiestMonth: "Busiest month",
      streak: "Longest streak",
      gap: "Longest break",
      days: (n, f) => `${f} day${n === 1 ? "" : "s"}`,
      msgs: (f) => `${f} messages`
    }
  }
};
var t = (lang) => STRINGS[lang];
function shortDate(date, lang) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
function longMonth(month, lang) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
}
function shortMonth(month, lang) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
}

// src/render/model.ts
var CARD_IDS = ["tokens", "year", "toolkit", "growth"];
function toolName(name) {
  const server = name.startsWith("mcp:") ? name.slice(4) : null;
  const out = server === null ? name : server === "connector" ? "Connector" : server.replace(/[_-]+/g, " ");
  return out.length > 18 ? `${out.slice(0, 15)}...` : out;
}
function modelLabel(id) {
  if (!id.startsWith("claude-")) return id;
  const [family, ...version] = id.slice(7).replace(/-\d{8}$/, "").split("-");
  return `${family.charAt(0).toUpperCase()}${family.slice(1)}${version.length ? ` ${version.join(".")}` : ""}`;
}
function monthSeries(byMonth) {
  if (byMonth.length === 0) return [];
  const map = new Map(byMonth.map((m2) => [m2.month, m2.messages]));
  const out = [];
  let [y, m] = byMonth[0].month.split("-").map(Number);
  const last = byMonth.at(-1).month;
  for (; ; ) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ month: key, messages: map.get(key) ?? 0 });
    if (key >= last) break;
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}
function hasCard(id, stats) {
  switch (id) {
    case "tokens":
      return stats.tokens.yearTotal > 0;
    case "year":
      return stats.prompts.count + stats.activity.toolCalls > 0;
    case "toolkit":
      return stats.tools.top.length > 0;
    case "growth":
      return stats.activity.byMonth.length >= 2;
  }
}
function buildCard(id, stats, copy, picked = CARD_IDS) {
  if (!hasCard(id, stats)) return null;
  const lang = copy.language;
  const s = t(lang).card;
  const n = (v) => num(v, lang);
  const items = [];
  const add = (label, value, text, note) => {
    if (value) items.push({ label: escapeHtml(label), value: escapeHtml(text ?? n(value)), ...note ? { note: escapeHtml(note) } : {} });
  };
  const shown = picked.filter((c) => hasCard(c, stats));
  const base = {
    id,
    index: shown.indexOf(id) + 1,
    total: shown.length,
    year: stats.year,
    title: fill(copy.title, stats, lang),
    heading: escapeHtml(s[id]),
    line: fill((id === "growth" ? copy.lines.growth : copy.lines[id]) ?? "", stats, lang),
    bars: [],
    tools: [],
    sum: null
  };
  if (id === "tokens") {
    const since = stats.tokens.usageFrom ? t(lang).since(shortDate(stats.tokens.usageFrom, lang)) : void 0;
    add(s.written, stats.tokens.yearOutput, stats.tokens.yearOutput ? compact(stats.tokens.yearOutput, lang) : void 0, since);
    const fav = stats.tokens.favoriteModel;
    if (fav) add(s.favorite, 1, `${modelLabel(fav.model)}, ${Math.round(fav.share * 100)}%`);
    const eq = new Map(stats.equivalents.map((e) => [e.id, e.value]));
    const wh = eq.get("energy");
    if (wh) add(s.energy, wh, `${n(wh)} Wh`, s.estimate);
    const water = eq.get("water");
    if (water) add(s.water, water, s.glasses(num(water, lang, 1)), s.estimate);
    return { ...base, hero: { value: compact(stats.tokens.yearTotal, lang), label: escapeHtml(s.tokensYear) }, items };
  }
  if (id === "year") {
    add(s.prompts, stats.prompts.count);
    add(s.slash, stats.prompts.slashCommands);
    add(s.politeness, stats.prompts.politeness);
    add(s.toolCalls, stats.activity.toolCalls);
    add(s.commits, stats.tools.commits);
    add(s.webSearches, stats.tools.webSearches);
    add(s.subagents, stats.sessions.subagentSessions);
    add(s.filesEdited, stats.files.edited);
    const api = stats.apiValue;
    const sum = api && api.usd >= 1 ? { label: escapeHtml(s.apiValue), value: `$${n(Math.round(api.usd))}`, note: escapeHtml(stats.tokens.usageFrom ? `${s.apiNote}, ${t(lang).since(shortDate(stats.tokens.usageFrom, lang))}` : s.apiNote) } : null;
    return { ...base, hero: null, items, sum };
  }
  if (id === "toolkit") {
    const top = stats.tools.top.slice(0, 10);
    const peak = top[0].count || 1;
    const langs = stats.files.byLanguage.length;
    add(s.languages, langs, void 0, stats.files.topLanguage ? s.topFirst(stats.files.topLanguage) : void 0);
    const tl = stats.tooling;
    const setup = [tl.skills ? s.skills(tl.skills, n(tl.skills)) : "", tl.agents ? s.agents(tl.agents, n(tl.agents)) : "", tl.hooks ? s.hooks(tl.hooks, n(tl.hooks)) : ""].filter(Boolean).join(", ");
    add(s.setup, tl.total, setup);
    add(s.plugins, tl.plugins);
    return {
      ...base,
      items,
      hero: { value: escapeHtml(toolName(top[0].name)), label: escapeHtml(s.topTools) },
      tools: top.map((x) => ({ name: escapeHtml(toolName(x.name)), count: n(x.count), share: x.count / peak }))
    };
  }
  const g = stats.activity.growth;
  const series = monthSeries(stats.activity.byMonth);
  add(s.messages, stats.activity.messages);
  const bm = stats.activity.busiestMonth;
  if (bm) add(s.busiestMonth, bm.messages, longMonth(bm.month, lang), s.msgs(n(bm.messages)));
  add(s.streak, stats.activity.longestStreakDays, s.days(stats.activity.longestStreakDays, n(stats.activity.longestStreakDays)));
  add(s.gap, stats.activity.longestGapDays, s.days(stats.activity.longestGapDays, n(stats.activity.longestGapDays)));
  const hero = g && g.factor >= 2 ? { value: `${n(g.factor)}x`, label: escapeHtml(s.busier(shortMonth(g.first.month, lang), shortMonth(g.peak.month, lang))) } : { value: n(stats.activity.messages), label: escapeHtml(s.messagesYear) };
  return {
    ...base,
    hero,
    items,
    bars: series.map((m) => ({ label: escapeHtml(shortMonth(m.month, lang)), value: m.messages, peak: !!g && m.month === g.peak.month }))
  };
}

// src/render/shell.ts
var SIZES = {
  story: { name: "story", w: 1080, h: 1920 },
  square: { name: "square", w: 1080, h: 1080 },
  wide: { name: "wide", w: 1200, h: 675 },
  readme: { name: "readme", w: 1200, h: 400 }
};
function page(opts) {
  return `<!doctype html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${opts.title}</title>
<style>
${opts.fontsCss}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-variant-numeric: tabular-nums; }
${opts.css}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
${opts.body}
</body>
</html>
`;
}
function progressBar(index, total) {
  const segs = Array.from({ length: total }, (_, i) => i <= index ? '<i class="on"></i>' : "<i></i>").join("");
  return `<div class="progress" aria-hidden="true">${segs}</div>`;
}
var PROGRESS_CSS = `
.progress { position: absolute; top: 48px; left: 64px; right: 64px; display: flex; gap: 10px; z-index: 2; }
.progress i { flex: 1; height: 8px; border-radius: 4px; background: rgba(16,21,28,.18); }
.progress i.on { background: #10151C; }
.dark .progress i { background: rgba(255,255,255,.25); }
.dark .progress i.on { background: #FFFFFF; }
`;

// src/render/styles/style.ts
var STYLE_IDS = ["clean", "receipt", "terminal", "card"];
function frame(ctx, style, model, inner, dark = false) {
  const vars = `--accent:${ctx.theme.accent};--deep:${ctx.theme.deep}`;
  const bar = ctx.progress ? progressBar(ctx.index, ctx.total) : "";
  return `<section class="slide st-${style} card-${model.id} size-${ctx.size.name}${dark ? " dark" : ""}" style="width:${ctx.size.w}px;height:${ctx.size.h}px;${vars}">${bar}${inner}</section>`;
}
var footer = () => `<footer class="repo">${REPO}</footer>`;

// src/render/theme.ts
import fs2 from "node:fs";
import path2 from "node:path";
var LANGUAGE_COLORS = {
  TypeScript: "#3178C6",
  JavaScript: "#C9B400",
  Python: "#3572A5",
  Java: "#B07219",
  Kotlin: "#A97BFF",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  CSS: "#563D7C",
  HTML: "#E34C26",
  SQL: "#E38C00",
  Markdown: "#083FA1",
  Config: "#6B7280"
};
var FALLBACK = "#3C6FA8";
var INK = "#10151C";
var WHITE = "#FFFFFF";
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function mix(a, b, weightB) {
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map((v, i) => Math.round(v * (1 - weightB) + y[i] * weightB).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function languageColor(lang) {
  const accent = lang && LANGUAGE_COLORS[lang] || FALLBACK;
  const onAccent = contrastRatio(accent, WHITE) >= contrastRatio(accent, INK) ? WHITE : INK;
  return { accent, deep: mix(accent, INK, 0.45), onAccent };
}
var PALETTE_IDS = ["auto", "ink", "grape", "sunset"];
var PALETTES = {
  ink: "#10151C",
  grape: "#7048E8",
  sunset: "#E8590C"
};
function paletteTheme(id, topLanguage) {
  if (id === "auto") return languageColor(topLanguage);
  const accent = PALETTES[id];
  const onAccent = contrastRatio(accent, WHITE) >= contrastRatio(accent, INK) ? WHITE : INK;
  return { accent, deep: id === "ink" ? INK : mix(accent, INK, 0.45), onAccent };
}
var FONT_FILES = [
  { family: "Archivo", file: "archivo-latin-wdth-normal.woff2", weight: "100 900", stretch: "62% 125%" },
  { family: '"IBM Plex Mono"', file: "ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
  { family: '"IBM Plex Mono"', file: "ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  { family: '"Big Shoulders Display"', file: "big-shoulders-display-latin-900-normal.woff2", weight: "900" },
  { family: '"Libre Franklin"', file: "libre-franklin-latin-400-normal.woff2", weight: "400" },
  { family: '"Libre Franklin"', file: "libre-franklin-latin-600-normal.woff2", weight: "600" },
  { family: '"Libre Franklin"', file: "libre-franklin-latin-900-normal.woff2", weight: "900" }
];
var fontCache = /* @__PURE__ */ new Map();
function fontFaceCss(assetsDir2, only) {
  const key = `${assetsDir2}|${only?.join(",") ?? "*"}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const css = FONT_FILES.filter((f) => !only || only.includes(f.family.replaceAll('"', ""))).map((f) => {
    const data = fs2.readFileSync(path2.join(assetsDir2, "fonts", f.file)).toString("base64");
    return `@font-face { font-family: ${f.family}; src: url(data:font/woff2;base64,${data}) format('woff2'); font-weight: ${f.weight};${f.stretch ? ` font-stretch: ${f.stretch};` : ""} font-display: block; }`;
  }).join("\n");
  fontCache.set(key, css);
  return css;
}

// src/render/styles/clean.ts
var toolLimit = (size) => size === "wide" ? 5 : 10;
function sideHtml(m, size, maxTools = toolLimit(size)) {
  const peak = Math.max(...m.bars.map((b) => b.value), 1);
  const bars = m.bars.length ? `<div class="bars">${m.bars.map((b) => `<div class="b${b.peak ? " pk" : ""}"><i style="height:${Math.max(2, Math.round(100 * b.value / peak))}%"></i><span>${b.label}</span></div>`).join("")}</div>` : "";
  const tools = m.tools.length ? `<ol class="tools">${m.tools.slice(0, maxTools).map((x) => `<li><span class="n">${x.name}</span><span class="c">${x.count}</span><i style="width:${Math.max(2, Math.round(100 * x.share))}%"></i></li>`).join("")}</ol>` : "";
  const items = m.items.length ? `<dl class="items">${m.items.map((i) => `<div><dt>${i.label}</dt><dd>${i.value}${i.note ? ` <small>${i.note}</small>` : ""}</dd></div>`).join("")}</dl>` : "";
  const sum = m.sum ? `<div class="sum"><span>${m.sum.label}</span><b>${m.sum.value}</b><small>${m.sum.note}</small></div>` : "";
  return `${bars}${tools}${items}${sum}`;
}
function render(m, ctx) {
  const hero = m.hero ? `<div class="hero"><div class="v">${m.hero.value}</div><div class="l">${m.hero.label}</div></div>` : "";
  const inner = `<div class="main">
    <header><div class="ttl">${m.title}</div><h2>${m.heading}</h2></header>
    ${hero}
    ${m.line ? `<p class="line">${m.line}</p>` : ""}
  </div>
  <div class="side">${sideHtml(m, ctx.size.name)}</div>
  ${footer()}`;
  return { css: CSS, html: frame(ctx, "clean", m, inner) };
}
var CSS = `
.st-clean { --hero: 300px; --big: 64px; --body: 44px; --small: 30px; --gap: 48px;
  background: #FFFFFF; color: #10151C; font-family: "Libre Franklin", sans-serif; padding: 130px 72px 64px;
  display: grid; grid-template: "main" auto "side" 1fr "foot" auto / minmax(0, 1fr); gap: var(--gap); }
.st-clean .side { align-self: end; }
.st-clean.size-square { --hero: 210px; --big: 50px; --body: 30px; --small: 22px; --gap: 32px; padding: 64px 64px 44px; }
.st-clean.size-square .items, .st-clean.size-square .tools { grid-template-columns: 1fr 1fr; column-gap: 48px; }
.st-clean.size-wide { --hero: 130px; --big: 40px; --body: 25px; --small: 19px; --gap: 18px 56px; padding: 44px 56px 30px;
  grid-template: "main side" 1fr "foot foot" auto / minmax(0, 1fr) minmax(0, 1fr); }
.st-clean.size-wide .side { align-self: start; }
.st-clean .main { grid-area: main; display: flex; flex-direction: column; gap: var(--gap); min-width: 0; }
.st-clean .side { grid-area: side; display: flex; flex-direction: column; gap: calc(var(--body) * .8); min-width: 0; }
.st-clean .ttl { font-size: var(--small); color: #4B5563; }
.st-clean h2 { margin: 6px 0 0; font: 800 var(--big)/1.05 Archivo, sans-serif; letter-spacing: -.01em; }
.st-clean .hero .v { font: 900 var(--hero)/.86 Archivo, sans-serif; letter-spacing: -.03em; white-space: nowrap; }
.st-clean.card-toolkit .hero .v { font-size: calc(var(--hero) * .45); line-height: 1; white-space: normal; }
.st-clean .hero .l { font: 600 var(--body)/1.2 Archivo, sans-serif; margin-top: calc(var(--body) * .4); color: var(--accent); }
.st-clean .line { margin: 0; font-size: var(--body); line-height: 1.3; color: #374151; max-width: 30ch; }
.st-clean .items { margin: 0; display: grid; }
.st-clean .items div { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; padding: calc(var(--body) * .4) 0; border-top: 2px solid #E3E7EC; }
.st-clean dt { font-size: var(--body); color: #374151; }
.st-clean dd { margin: 0; font: 800 var(--body)/1.2 Archivo, sans-serif; text-align: right; white-space: nowrap; }
.st-clean dd small, .st-clean .sum small { display: block; font: 400 var(--small)/1.2 "Libre Franklin", sans-serif; color: #6B7280; }
.st-clean .sum { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding-top: calc(var(--body) * .5); border-top: 4px solid #10151C; }
.st-clean .sum span { font: 700 var(--body) Archivo, sans-serif; }
.st-clean .sum b { font: 900 calc(var(--big) * 1.1)/1 Archivo, sans-serif; color: var(--accent); }
.st-clean .sum small { grid-column: 1 / -1; }
.st-clean .bars { display: flex; align-items: flex-end; gap: calc(var(--body) * .3); height: calc(var(--hero) * 1.6); }
.st-clean .bars .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; }
.st-clean .bars i { display: block; width: 100%; border-radius: 6px 6px 0 0; background: color-mix(in oklab, var(--accent) 30%, #FFFFFF); }
.st-clean .bars .pk i { background: var(--accent); }
.st-clean .bars span { font-size: var(--small); color: #4B5563; }
.st-clean .tools { list-style: none; margin: 0; padding: 0; display: grid; gap: calc(var(--body) * .35); }
.st-clean .tools li { display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; font-size: var(--small); }
.st-clean .tools .n { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-clean .tools .c { font-family: Archivo, sans-serif; font-weight: 700; }
.st-clean .tools i { grid-column: 1 / -1; display: block; height: calc(var(--small) * .45); border-radius: 4px; background: var(--accent); }
.st-clean .repo { grid-area: foot; font-size: var(--small); color: #6B7280; }
`;

// src/render/styles/card.ts
function level(yearTokens) {
  return Math.max(1, Math.min(99, Math.floor(Math.log2(yearTokens / 1e6 + 1) * 5)));
}
function rarity(stats) {
  const strong = stats.strengthCandidates.filter((c) => c.score >= 1).length;
  return strong >= 4 ? "legendary" : strong >= 2 ? "rare" : "common";
}
function sprite(stats, accent, deep) {
  const key = `${stats.activity.sessions}|${stats.tools.bash}|${stats.tools.testRuns}|${stats.tools.commits}|${stats.files.topLanguage ?? ""}`;
  let seed = 2166136261;
  for (const ch of key) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => {
    seed = Math.imul(seed, 1103515245) + 12345 >>> 0;
    return (seed >>> 8) / 16777216;
  };
  const colors = [deep, accent, INK];
  const rects = [];
  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 6; x++) {
      if (rnd() < (x === 1 || y === 1 || y === 10 ? 0.35 : 0.62)) {
        const fill2 = colors[Math.floor(rnd() * colors.length)];
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill2}"/>`, `<rect x="${11 - x}" y="${y}" width="1" height="1" fill="${fill2}"/>`);
      }
    }
  }
  rects.push('<rect x="4" y="4" width="1" height="1" fill="#FFFFFF"/>', '<rect x="7" y="4" width="1" height="1" fill="#FFFFFF"/>');
  return `<svg viewBox="0 0 12 12" width="260" height="260" shape-rendering="crispEdges" role="img" aria-label="creature">${rects.join("")}</svg>`;
}
function render2(m, ctx) {
  const s = t(ctx.lang);
  const lv = level(ctx.stats.tokens.yearTotal);
  const rare = s.rarity[rarity(ctx.stats)];
  const hero = m.hero ? `<div class="hero"><b>${m.hero.value}</b><span>${m.hero.label}</span></div>` : "";
  const cardHtml = `<div class="card"><div class="face">
    <div class="top"><div class="name">${m.title}</div><div class="lv">${s.level} <b>${lv}</b></div></div>
    <div class="window">${sprite(ctx.stats, ctx.theme.accent, ctx.theme.deep)}</div>
    <div class="type">${m.heading}</div>
    ${hero}
    <div class="side">${sideHtml(m, ctx.size.name, 6)}</div>
    ${m.line ? `<p class="flavor">${m.line}</p>` : ""}
    <div class="bottom"><span>${m.index}/${m.total}</span><span>${rare}</span></div>
  </div></div>`;
  const aside = ctx.size.name === "wide" ? `<div class="aside"><div class="aname">${m.title}</div><div class="ameta">${m.heading}, ${s.level} ${lv}, ${rare}</div>${m.line ? `<p>${m.line}</p>` : ""}</div>` : "";
  return { css: CSS2, html: frame(ctx, "card", m, `<div class="stage">${cardHtml}</div>${aside}${footer()}`) };
}
var CSS2 = `
.st-card { --body: 32px; --small: 24px; background: #E9ECF1; font-family: Archivo, sans-serif; color: #10151C; }
.st-card .stage { position: absolute; inset: 0 0 60px; display: grid; place-items: center; }
.st-card .card { width: 860px; height: 1440px; border-radius: 40px; padding: 26px; background: var(--deep); box-shadow: 0 60px 110px rgba(16,21,28,.35); transform: rotate(1.2deg); }
.st-card.size-square .card { zoom: .64; }
.st-card.size-wide .stage { right: auto; width: 560px; bottom: 30px; }
.st-card.size-wide .card { zoom: .42; }
.st-card .face { height: 100%; border-radius: 22px; background: #F7F8FA; padding: 30px 40px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
.st-card .top { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.st-card .name { font: 900 80px/1 "Big Shoulders Display", sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-card .lv { font-weight: 700; font-size: 36px; color: var(--deep); white-space: nowrap; }
.st-card .lv b { font-size: 58px; }
.st-card .window { height: 300px; flex: none; border-radius: 14px; border: 6px solid var(--deep); background: color-mix(in oklab, var(--accent) 14%, #F7F8FA); display: grid; place-items: center; }
.st-card .type { font-size: 30px; font-weight: 700; color: var(--deep); }
.st-card .hero b { display: block; font: 900 120px/.9 Archivo, sans-serif; letter-spacing: -.02em; white-space: nowrap; }
.st-card.card-toolkit .hero b { font-size: 72px; }
.st-card .hero span { font-size: var(--small); color: #4B5563; }
.st-card .side { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.st-card .items { margin: 0; display: grid; }
.st-card .items div { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; padding: 9px 0; border-top: 3px solid #D5DAE1; }
.st-card dt { font-size: var(--body); color: #374151; }
.st-card dd { margin: 0; font: 800 var(--body)/1.2 Archivo, sans-serif; color: var(--deep); text-align: right; white-space: nowrap; }
.st-card dd small, .st-card .sum small { display: block; font-size: 20px; font-weight: 400; color: #6B7280; }
.st-card .sum { display: grid; grid-template-columns: 1fr auto; align-items: baseline; border-top: 4px solid var(--deep); padding-top: 10px; }
.st-card .sum span { font-size: var(--body); font-weight: 700; }
.st-card .sum b { font-size: 56px; font-weight: 900; color: var(--deep); }
.st-card .sum small { grid-column: 1 / -1; }
.st-card .bars { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
.st-card .bars .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; }
.st-card .bars i { display: block; width: 100%; border-radius: 4px 4px 0 0; background: color-mix(in oklab, var(--accent) 35%, #F7F8FA); }
.st-card .bars .pk i { background: var(--deep); }
.st-card .bars span { font-size: 20px; color: #4B5563; }
.st-card .tools { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.st-card .tools li { display: grid; grid-template-columns: 1fr auto; gap: 2px 14px; font-size: 26px; }
.st-card .tools .n { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-card .tools .c { font-weight: 800; color: var(--deep); }
.st-card .tools i { grid-column: 1 / -1; display: block; height: 10px; border-radius: 3px; background: var(--accent); }
.st-card .flavor { margin: 0; font: 400 28px/1.3 "Libre Franklin", sans-serif; color: #4B5563; }
.st-card .bottom { margin-top: auto; display: flex; justify-content: space-between; font-size: 26px; font-weight: 700; color: #4B5563; border-top: 3px solid #D5DAE1; padding-top: 12px; }
.st-card .aside { position: absolute; left: 600px; right: 56px; top: 0; bottom: 60px; display: flex; flex-direction: column; justify-content: center; }
.st-card .aname { font: 900 96px/.95 "Big Shoulders Display", sans-serif; }
.st-card .ameta { font-size: 28px; font-weight: 700; color: var(--deep); margin-top: 16px; }
.st-card .aside p { font: 400 28px/1.3 "Libre Franklin", sans-serif; color: #4B5563; margin: 20px 0 0; }
.st-card .repo { position: absolute; left: 0; right: 0; bottom: 22px; text-align: center; font: 400 var(--small) "Libre Franklin", sans-serif; color: #4B5563; }
.st-card.size-wide .repo { font-size: 18px; bottom: 14px; }
`;

// src/render/styles/receipt.ts
var DAY = 864e5;
var toMs = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
var TOOLS = { story: 10, square: 6, wide: 5 };
function barcode(daily) {
  if (daily.length === 0) return "";
  const first = toMs(daily[0].date);
  const days = Math.round((toMs(daily.at(-1).date) - first) / DAY) + 1;
  const byDate = new Map(daily.map((d) => [d.date, d.messages]));
  const max = Math.max(...daily.map((d) => d.messages), 1);
  return `<div class="code">${Array.from({ length: days }, (_, i) => {
    const v = byDate.get(new Date(first + i * DAY).toISOString().slice(0, 10)) ?? 0;
    return `<i class="bar" style="height:${Math.max(6, Math.round(100 * Math.sqrt(v / max)))}%"></i>`;
  }).join("")}</div>`;
}
function render3(m, ctx) {
  const ln = (label, value, cls = "") => `<div class="ln${cls}"><span>${label}</span><span>${value}</span></div>`;
  const peak = Math.max(...m.bars.map((b) => b.value), 1);
  const blocks = (v) => "#".repeat(Math.max(v > 0 ? 1 : 0, Math.round(12 * v / peak)));
  const body = [
    m.hero ? `<div class="hero"><b>${m.hero.value}</b><span>${m.hero.label}</span></div><hr>` : "",
    m.bars.length ? m.bars.map((b) => ln(`${b.label} <em>${blocks(b.value)}</em>`, num(b.value, ctx.lang))).join("") + "<hr>" : "",
    m.tools.length ? m.tools.slice(0, TOOLS[ctx.size.name] ?? 10).map((x) => ln(x.name, x.count)).join("") + "<hr>" : "",
    m.items.map((i) => ln(i.label, `${i.value}${i.note ? `*` : ""}`)).join(""),
    m.sum ? `<hr>${ln(m.sum.label, m.sum.value, " tot")}<div class="note">${m.sum.note}</div>` : "",
    m.items.some((i) => i.note) ? `<div class="note">* ${[...new Set(m.items.filter((i) => i.note).map((i) => i.note))].join(", ")}</div>` : ""
  ].join("");
  const inner = `<div class="slip">
    <h3>PROMPTFOLIO</h3>
    <div class="c">${m.heading}<br>${t(ctx.lang).receiptYear(m.year)}<br>${m.title}</div>
    <hr><div class="body">${body}</div><hr>
    ${m.line ? `<div class="c say">${m.line}</div>` : ""}
    ${barcode(ctx.stats.activity.daily)}
    <div class="c repo">${REPO}</div>
  </div>`;
  return { css: CSS3, html: frame(ctx, "receipt", m, inner) };
}
var CSS3 = `
.st-receipt { --f: 36px; --w: 880px; background: var(--accent); display: grid; place-items: center; }
.st-receipt.size-square { --f: 23px; --w: 640px; }
.st-receipt.size-wide { --f: 18px; --w: 980px; }
.st-receipt.size-wide .body { columns: 2; column-gap: 2.4em; column-rule: 2px dashed #111111; }
.st-receipt.size-wide .slip { transform: rotate(-1deg); }
.st-receipt .slip { width: var(--w); background: #FFFFFF; color: #111111; font: 400 var(--f)/1.4 "IBM Plex Mono", monospace;
  padding: calc(var(--f) * 2) calc(var(--f) * 1.8) calc(var(--f) * 2.4); transform: rotate(-1.6deg); box-shadow: 0 40px 80px rgba(0,0,0,.28);
  -webkit-mask: radial-gradient(calc(var(--f) * .4) at 50% 100%, transparent 98%, #000) 0 0 / calc(var(--f) * 1.2) 100% repeat-x;
          mask: radial-gradient(calc(var(--f) * .4) at 50% 100%, transparent 98%, #000) 0 0 / calc(var(--f) * 1.2) 100% repeat-x; }
.st-receipt h3 { font: 600 calc(var(--f) * 1.5)/1.1 "IBM Plex Mono", monospace; text-align: center; margin: 0 0 .2em; letter-spacing: .08em; }
.st-receipt .c { text-align: center; }
.st-receipt hr { border: 0; border-top: 3px dashed #111111; margin: .7em 0; }
.st-receipt .ln { display: flex; justify-content: space-between; gap: 1em; }
.st-receipt .ln { break-inside: avoid; }
.st-receipt .ln span:first-child { min-width: 0; }
.st-receipt .ln span:last-child { white-space: nowrap; text-align: right; }
.st-receipt .ln em { font-style: normal; color: #6B7280; }
.st-receipt .hero { text-align: center; }
.st-receipt .hero b { display: block; font: 600 calc(var(--f) * 2.8)/1.05 "IBM Plex Mono", monospace; }
.st-receipt .hero span { text-transform: uppercase; letter-spacing: .06em; }
.st-receipt .tot { font-weight: 600; font-size: calc(var(--f) * 1.3); }
.st-receipt .note { font-size: calc(var(--f) * .7); color: #4B5563; }
.st-receipt .say { margin: .4em 0; }
.st-receipt .code { display: flex; align-items: flex-end; gap: 1px; height: calc(var(--f) * 2.6); margin-top: 1em; }
.st-receipt .bar { flex: 1; background: #111111; }
.st-receipt .repo { font-size: calc(var(--f) * .7); margin-top: .6em; }
`;

// src/render/styles/terminal.ts
var TOOLS2 = { story: 10, square: 7, wide: 5 };
function render4(m, ctx) {
  const row = (k, v, cls = "v") => `<div class="row"><span class="k">${k}</span><span class="${cls}">${v}</span></div>`;
  const bar = (share) => `<i class="bar" style="width:${Math.max(2, Math.round(100 * share))}%"></i>`;
  const peak = Math.max(...m.bars.map((b) => b.value), 1);
  const body = [
    m.hero ? `<div class="hero"><b>${m.hero.value}</b> <span class="k">${m.hero.label}</span></div>` : "",
    m.bars.length ? `<div class="chart">${m.bars.map((b) => `<div class="cr${b.peak ? " pk" : ""}"><span class="k">${b.label}</span>${bar(b.value / peak)}<span class="v">${num(b.value, ctx.lang)}</span></div>`).join("")}</div>` : "",
    m.tools.length ? `<div class="chart">${m.tools.slice(0, TOOLS2[ctx.size.name] ?? 10).map((x) => `<div class="cr"><span class="v name">${x.name}</span>${bar(x.share)}<span class="v">${x.count}</span></div>`).join("")}</div>` : "",
    m.items.length ? `<div class="rows">${m.items.map((i) => row(i.label, `${i.value}${i.note ? ` <span class="k">(${i.note})</span>` : ""}`)).join("")}</div>` : "",
    m.sum ? `<div>${row(m.sum.label, m.sum.value, "hl")}<div class="k">(${m.sum.note})</div></div>` : ""
  ].join("");
  const inner = `<div class="win">
    <div class="dots"><i></i><i></i><i></i></div>
    <div class="p">~ <b>$</b> promptfolio ${m.id} --year ${m.year}</div>
    <div class="k">${m.heading}, ${m.title}</div>
    <div class="body">${body}</div>
    ${m.line ? `<div class="k say"># ${m.line}</div>` : ""}
    <div class="p">~ <b>$</b> <span class="caret"></span></div>
    <div class="k repo">${REPO}</div>
  </div>`;
  return { css: CSS4, html: frame(ctx, "terminal", m, inner, true) };
}
var CSS4 = `
.st-terminal { --f: 36px; background: #0D1117; color: #D7DEE8; font: 400 var(--f)/1.5 "IBM Plex Mono", monospace; padding: 130px 60px 70px; }
.st-terminal.size-square { --f: 23px; padding: 52px; }
.st-terminal.size-wide { --f: 18px; padding: 36px 44px; }
.st-terminal .win { border-radius: calc(var(--f) * .6); background: #161B22; border: 2px solid #262D37; padding: calc(var(--f) * 1.2) calc(var(--f) * 1.3); height: 100%; overflow: hidden; display: flex; flex-direction: column; gap: calc(var(--f) * .5); }
.st-terminal .dots { display: flex; gap: calc(var(--f) * .4); margin-bottom: calc(var(--f) * .5); }
.st-terminal .dots i { width: calc(var(--f) * .6); height: calc(var(--f) * .6); border-radius: 50%; background: #2E3743; }
.st-terminal .p, .st-terminal .k { color: #8B97A7; }
.st-terminal .p b, .st-terminal .v { color: #FFFFFF; font-weight: 600; }
.st-terminal .hl { color: color-mix(in oklab, var(--accent) 60%, #FFFFFF); font-weight: 600; }
.st-terminal .body { display: flex; flex-direction: column; gap: calc(var(--f) * .7); margin: calc(var(--f) * .5) 0; min-height: 0; flex: 0 1 auto; overflow: hidden; }
.st-terminal.size-wide .hero b { font-size: calc(var(--f) * 2); }
.st-terminal.size-wide .body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 2.4em; align-content: start; }
.st-terminal.size-wide .chart { grid-column: 2; grid-row: 1 / span 3; }
.st-terminal .hero b { font-size: calc(var(--f) * 2.6); line-height: 1.05; color: #FFFFFF; }
.st-terminal .row { display: flex; justify-content: space-between; gap: 1em; }
.st-terminal .row .v, .st-terminal .row .hl { text-align: right; white-space: nowrap; }
.st-terminal .chart { display: grid; gap: calc(var(--f) * .2); }
.st-terminal .cr { display: grid; grid-template-columns: 8.5em 1fr 4.5em; align-items: center; gap: .6em; }
.st-terminal .cr .v:last-child { text-align: right; }
.st-terminal .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-terminal .bar { display: block; height: .62em; border-radius: 2px; background: color-mix(in oklab, var(--accent) 45%, #2E3743); }
.st-terminal .pk .bar, .st-terminal .cr:first-child .bar { background: color-mix(in oklab, var(--accent) 60%, #FFFFFF); }
.st-terminal .say { white-space: normal; }
.st-terminal .repo { margin-top: auto; font-size: calc(var(--f) * .7); }
.st-terminal .caret { display: inline-block; width: .55em; height: 1.1em; background: #D7DEE8; vertical-align: -.2em; animation: pf-blink 1.1s steps(1) infinite; }
@keyframes pf-blink { 50% { opacity: 0; } }
`;

// src/render/cards.ts
var CARD_FORMATS = ["story", "square", "wide"];
var STYLES = {
  clean: render,
  receipt: render3,
  terminal: render4,
  card: render2
};
var BASE_CSS = `
.slide { position: relative; overflow: hidden; flex: none; }
`;
function renderCard(style, model, ctx) {
  return STYLES[style](model, ctx);
}
function styleCtx(stats, copy, size, extra = {}, palette = "auto") {
  return { stats, lang: copy.language, theme: paletteTheme(palette, stats.files.topLanguage), size: SIZES[size], index: 0, total: 1, ...extra };
}
function cardDocument(style, id, format2, stats, copy, assetsDir2, picked = CARD_IDS, palette = "auto") {
  const model = buildCard(id, stats, copy, picked);
  if (!model) return null;
  const out = renderCard(style, model, styleCtx(stats, copy, format2, {}, palette));
  const { w, h } = SIZES[format2];
  return page({
    title: `Promptfolio ${id}`,
    lang: copy.language,
    fontsCss: fontFaceCss(assetsDir2),
    css: `${BASE_CSS}${out.css}
html, body { width: ${w}px; height: ${h}px; overflow: hidden; }`,
    body: out.html
  });
}

// src/render/readme.ts
function readmeCard(opts) {
  const { stats } = opts;
  const lang = opts.copy.language;
  const s = t(lang);
  const theme = paletteTheme(opts.palette ?? "auto", stats.files.topLanguage);
  const months = stats.activity.byMonth;
  const max = Math.max(...months.map((m) => m.messages), 1);
  const x = (i) => 920 + i * (230 / Math.max(1, months.length - 1));
  const y = (v) => 330 - 220 * (v / max);
  const line = months.length > 1 ? "M" + months.map((m, i) => `${x(i).toFixed(1)} ${y(m.messages).toFixed(1)}`).join(" L") : "";
  const stat = (label, value, sx) => `<text x="${sx}" y="280" class="v">${escapeHtml(value)}</text><text x="${sx}" y="318" class="l">${escapeHtml(label)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" role="img" aria-label="Promptfolio ${stats.year}">
<style>
${fontFaceCss(opts.assetsDir, ["Archivo"])}
text { font-family: Archivo, sans-serif; fill: #10151C; }
.w { font-weight: 900; font-size: 52px; }
.y { font-weight: 600; font-size: 28px; fill: #4B5563; }
.v { font-weight: 900; font-size: 64px; }
.l { font-weight: 500; font-size: 24px; fill: #4B5563; }
.r { font-weight: 500; font-size: 22px; fill: #6B7280; }
.line { fill: none; stroke: ${theme.accent}; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: draw 1.6s cubic-bezier(.22,1,.36,1) both; }
@keyframes draw { from { stroke-dashoffset: 1; } }
@media (prefers-reduced-motion: reduce) { .line { animation: none; } }
</style>
<rect width="1200" height="400" rx="28" fill="#FFFFFF"/>
<rect x="0" y="0" width="14" height="400" rx="7" fill="${theme.accent}"/>
<text x="64" y="104" class="w">Promptfolio</text>
<text x="64" y="148" class="y">Claude Code, ${stats.year}</text>
${stat(s.tokensRead, compact(stats.tokens.yearTotal, lang), 64)}
${stat(s.sessions.toLowerCase(), num(stats.activity.sessions, lang), 300)}
${stats.files.topLanguage ? stat(s.topLanguage, stats.files.topLanguage, 500) : ""}
${line ? `<path d="${line}" class="line" pathLength="1"/>` : ""}
<text x="1150" y="376" text-anchor="end" class="r">${REPO}</text>
</svg>
`;
}

// src/render/story.ts
function buildStory(opts) {
  const { stats, copy, style } = opts;
  const lang = copy.language;
  const s = t(lang);
  const models = CARD_IDS.map((id) => buildCard(id, stats, copy)).filter((m) => m !== null);
  const css = /* @__PURE__ */ new Set([BASE_CSS, PROGRESS_CSS]);
  const slides = models.map((m, i) => {
    const out = renderCard(style, m, styleCtx(stats, copy, "story", { index: i, total: models.length, progress: true }, opts.palette));
    css.add(out.css);
    const png = `cards/${style}-${m.id}-story.png`;
    const action = opts.pngs.has(png) ? `<a class="save" href="${png}" download>${s.save}</a>` : `<span class="hint">${s.screenshot}</span>`;
    return `<figure class="frame" data-i="${i}"${i === 0 ? "" : " hidden"}><div class="fit">${out.html}</div><figcaption>${action}</figcaption></figure>`;
  });
  return page({
    title: `Promptfolio ${stats.year}`,
    lang,
    fontsCss: fontFaceCss(opts.assetsDir),
    css: [...css].join("\n") + VIEWER_CSS,
    body: `<main class="viewer">
  ${slides.join("\n  ")}
  <button class="nav prev" type="button" aria-label="${s.previous}"></button>
  <button class="nav next" type="button" aria-label="${s.next}"></button>
</main>
<script>${VIEWER_JS}</script>`
  });
}
var VIEWER_CSS = `
/* A safe scale before the script runs, so phones never widen their layout to the 1080px slide. */
:root { --k: 0.3; }
html, body { overflow-x: hidden; }
body { background: #0B0D10; min-height: 100vh; font-family: "Libre Franklin", sans-serif; }
.viewer { position: relative; min-height: 100vh; display: grid; place-items: center; }
.frame { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.frame[hidden] { display: none; }
.fit { width: calc(1080px * var(--k)); height: calc(1920px * var(--k)); border-radius: calc(36px * var(--k)); overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.fit > .slide { transform: scale(var(--k)); transform-origin: 0 0; }
figcaption { font-size: 15px; color: #C9D2DD; min-height: 22px; }
.save { color: #FFFFFF; text-decoration: underline; text-underline-offset: 3px; }
.save:focus-visible, .nav:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
.nav { position: fixed; top: 0; bottom: 0; width: 50%; background: none; border: 0; cursor: pointer; }
.nav.prev { left: 0; } .nav.next { right: 0; }
`;
var VIEWER_JS = `
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
  var i = 0, paused = false, timer = null;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fit() {
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var k = Math.min((vw - 32) / 1080, (vh - 72) / 1920);
    document.documentElement.style.setProperty('--k', String(Math.max(0.1, k)));
  }
  function show(n) {
    i = Math.max(0, Math.min(frames.length - 1, n));
    frames.forEach(function (f, j) { f.hidden = j !== i; });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!calm && !paused && i < frames.length - 1) timer = setTimeout(function () { show(i + 1); }, 7000);
  }
  document.querySelector('.nav.next').addEventListener('click', function () { show(i + 1); });
  document.querySelector('.nav.prev').addEventListener('click', function () { show(i - 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === ' ') { e.preventDefault(); paused = !paused; schedule(); }
  });
  window.addEventListener('resize', fit);
  fit(); show(0);
})();
`;

// src/cli/render.ts
var FORMATS = [...CARD_FORMATS, "readme"];
var assetsDir = path3.join(path3.dirname(fileURLToPath(import.meta.url)), "..", "assets");
function list(flag, value, allowed, fallback) {
  if (value === void 0) return fallback;
  const picked = value.split(",").map((s) => s.trim()).filter(Boolean);
  const bad = picked.filter((x) => !allowed.includes(x));
  if (bad.length || picked.length === 0) {
    console.error(`Invalid --${flag}: ${value || "(empty)"} (use ${allowed.join(", ")})`);
    return null;
  }
  return [...new Set(picked)];
}
async function main() {
  const { values } = parseArgs({
    // No `default:` options: parseArgs only supports them from Node 18.11, and the scripts promise 18.3.
    options: { dir: { type: "string" }, style: { type: "string" }, palette: { type: "string" }, cards: { type: "string" }, formats: { type: "string" }, "no-png": { type: "boolean" } }
  });
  if (!values.dir) {
    console.error("Missing --dir <folder with stats.json and copy.json>.");
    return 1;
  }
  const dir = path3.resolve(values.dir);
  const style = list("style", values.style, STYLE_IDS, ["clean"]);
  const cards = list("cards", values.cards, CARD_IDS, CARD_IDS);
  const formats = list("formats", values.formats, FORMATS, ["story"]);
  const palette = list("palette", values.palette, PALETTE_IDS, ["auto"]);
  if (!style || !cards || !formats || !palette) return 1;
  if (style.length !== 1) {
    console.error(`Invalid --style: pick one of ${STYLE_IDS.join(", ")}`);
    return 1;
  }
  if (palette.length !== 1) {
    console.error(`Invalid --palette: pick one of ${PALETTE_IDS.join(", ")}`);
    return 1;
  }
  let stats;
  let copy;
  try {
    stats = JSON.parse(fs3.readFileSync(path3.join(dir, "stats.json"), "utf8"));
    copy = JSON.parse(fs3.readFileSync(path3.join(dir, "copy.json"), "utf8"));
  } catch (err) {
    console.error(`Could not read stats.json and copy.json in ${dir}: ${err instanceof Error ? err.message : err}`);
    return 1;
  }
  const check = validateCopy(copy, stats);
  if (!check.ok) {
    for (const e of check.errors) console.log(e);
    return 1;
  }
  const cardsDir = path3.join(dir, "cards");
  fs3.mkdirSync(cardsDir, { recursive: true });
  const written = [];
  const noPng = values["no-png"] === true;
  const browser = noPng || process.env.PROMPTFOLIO_BROWSER === "none" ? null : findBrowser({ platform: process.platform, env: process.env, exists: fs3.existsSync });
  if (!noPng && !browser) {
    console.log(process.env.PROMPTFOLIO_BROWSER === "none" ? "PROMPTFOLIO_BROWSER=none: PNGs skipped, story.html still works." : "No Chrome, Edge or Brave found: PNGs skipped, story.html still works.");
  }
  const shoot = async (htmlPath, png, width, height) => {
    if (!browser) return;
    try {
      await screenshot({ browser, htmlPath, outPng: png, width, height });
      written.push(png);
    } catch (err) {
      console.log(`Could not render ${path3.basename(png)}: ${err instanceof Error ? err.message : err}`);
    }
  };
  for (const card of cards) {
    for (const format2 of formats) {
      if (format2 === "readme") continue;
      const html = cardDocument(style[0], card, format2, stats, copy, assetsDir, cards, palette[0]);
      if (!html) {
        if (format2 === formats.find((f) => f !== "readme")) console.log(`skipped ${card}: not enough data`);
        continue;
      }
      const htmlPath = path3.join(cardsDir, `${style[0]}-${card}-${format2}.html`);
      fs3.writeFileSync(htmlPath, html);
      await shoot(htmlPath, htmlPath.replace(/\.html$/, ".png"), SIZES[format2].w, SIZES[format2].h);
    }
  }
  if (formats.includes("readme")) {
    const svg = readmeCard({ stats, copy, assetsDir, palette: palette[0] });
    const svgPath = path3.join(dir, "readme-card.svg");
    fs3.writeFileSync(svgPath, svg);
    written.push(svgPath);
    if (browser) {
      const wrap = path3.join(cardsDir, "readme-card.html");
      fs3.writeFileSync(wrap, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:400px;overflow:hidden}</style></head><body>${svg}</body></html>`);
      await shoot(wrap, path3.join(dir, "readme-card.png"), 1200, 400);
    }
  }
  const captionsPath = path3.join(dir, "captions.json");
  fs3.writeFileSync(captionsPath, JSON.stringify(buildCaptions(copy, stats), null, 2));
  const pngs = new Set(fs3.readdirSync(cardsDir).filter((f) => f.startsWith(`${style[0]}-`) && f.endsWith("-story.png")).map((f) => `cards/${f}`));
  const storyPath = path3.join(dir, "story.html");
  fs3.writeFileSync(storyPath, buildStory({ stats, copy, style: style[0], palette: palette[0], assetsDir, pngs }));
  for (const f of [storyPath, ...written, captionsPath]) console.log(f);
  return 0;
}
main().then((code) => {
  process.exitCode = code;
}, (err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

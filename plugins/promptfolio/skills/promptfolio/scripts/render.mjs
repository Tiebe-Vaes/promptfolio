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
var COPY_LIMITS = {
  headline: 60,
  strength: 90,
  className: 22,
  specialMove: 40,
  weakness: 40,
  nemesis: 32,
  diary: 160,
  awardTitle: 32,
  awardText: 120,
  relationshipStatus: 24,
  relationshipText: 140,
  caption: 120,
  tokensLine: 90,
  moveName: 22,
  moveText: 60,
  receiptFooter: 60,
  verdict: 70,
  growthLine: 40
};
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
function format(path4, value, language) {
  if (typeof value === "string") {
    if (path4.endsWith(".month") && /^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return new Intl.DateTimeFormat(language === "nl" ? "nl-BE" : "en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
    }
    return value;
  }
  if (path4.endsWith("Share") && value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat(language === "nl" ? "nl-BE" : "en-US", { maximumFractionDigits: 1 }).format(value);
}
function fillPlaceholders(text, stats, language) {
  return text.replace(PLACEHOLDER_RE, (whole, path4) => {
    const v = resolve(stats, path4);
    return v === void 0 ? whole : format(path4, v, language);
  });
}
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function validateCopy(copy, stats) {
  const errors = [];
  if (!isObj(copy)) return { ok: false, errors: ["copy: must be a JSON object"] };
  const language = copy.language === "nl" ? "nl" : "en";
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
    const filled = fillPlaceholders(value, stats, language);
    if (filled.length > COPY_LIMITS[limit]) errors.push(`${path4}: too long (${filled.length} > ${COPY_LIMITS[limit]} characters after filling)`);
  };
  const list = (path4, value, min, max) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      errors.push(`${path4}: needs ${min === max ? min : `${min}-${max}`} entries`);
      return [];
    }
    return value;
  };
  if (copy.schemaVersion !== 1) errors.push("schemaVersion: must be 1");
  if (copy.language !== "en" && copy.language !== "nl") errors.push('language: must be "en" or "nl"');
  if (!["professional", "fun", "roast"].includes(copy.vibe)) errors.push('vibe: must be "professional", "fun" or "roast"');
  if (copy.vibe === "professional") {
    const profile = copy.profile;
    if (!isObj(profile)) errors.push("profile: required for the professional vibe");
    else {
      text("profile.headline", profile.headline, "headline");
      const candidates = new Set(stats.strengthCandidates.map((c) => c.id));
      const seen = /* @__PURE__ */ new Set();
      list("profile.strengths", profile.strengths, 3, 3).forEach((s, i) => {
        const id = isObj(s) ? s.id : void 0;
        if (typeof id !== "string" || !candidates.has(id)) errors.push(`profile.strengths.${i}.id: must be one of the strength candidates in stats`);
        else if (seen.has(id)) errors.push(`profile.strengths.${i}.id: duplicate strength`);
        else seen.add(id);
        text(`profile.strengths.${i}.text`, isObj(s) ? s.text : void 0, "strength");
      });
    }
  }
  text("tokensLine", copy.tokensLine, "tokensLine");
  text("verdict", copy.verdict, "verdict");
  if (copy.vibe === "professional" && stats.activity.growth) text("growthLine", copy.growthLine, "growthLine");
  if (copy.vibe === "fun" || copy.vibe === "roast") {
    text("receiptFooter", copy.receiptFooter, "receiptFooter");
    const p = copy.persona;
    if (!isObj(p)) errors.push("persona: required for the fun and roast vibes");
    else {
      text("persona.className", p.className, "className");
      text("persona.specialMove", p.specialMove, "specialMove");
      text("persona.weakness", p.weakness, "weakness");
      text("persona.nemesis", p.nemesis, "nemesis");
      list("persona.moves", p.moves, 3, 3).forEach((mv, i) => {
        const m = isObj(mv) ? mv : {};
        text(`persona.moves.${i}.name`, m.name, "moveName");
        text(`persona.moves.${i}.text`, m.text, "moveText");
        const value = typeof m.value === "string" ? m.value.match(/^\{([A-Za-z0-9_.]+)\}$/) : null;
        if (!value || typeof resolve(stats, value[1]) !== "number") errors.push(`persona.moves.${i}.value: must be exactly one {placeholder} that resolves to a number`);
      });
    }
    list("diary", copy.diary, 3, 5).forEach((d, i) => text(`diary.${i}`, d, "diary"));
    list("awards", copy.awards, 3, 4).forEach((a, i) => {
      text(`awards.${i}.title`, isObj(a) ? a.title : void 0, "awardTitle");
      text(`awards.${i}.text`, isObj(a) ? a.text : void 0, "awardText");
    });
    const r = copy.relationship;
    if (!isObj(r)) errors.push("relationship: required for the fun and roast vibes");
    else {
      text("relationship.status", r.status, "relationshipStatus");
      text("relationship.text", r.text, "relationshipText");
    }
  }
  if (!isObj(copy.captions)) errors.push("captions: must be an object of strings");
  else for (const [k, v] of Object.entries(copy.captions)) text(`captions.${k}`, v, "caption");
  return { ok: errors.length === 0, errors };
}

// src/render/shell.ts
var SIZES = {
  story: { name: "story", w: 1080, h: 1920 },
  feed: { name: "feed", w: 1080, h: 1350 },
  landscape: { name: "landscape", w: 1200, h: 675 },
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

// src/render/slide.ts
function frame(ctx, cls, inner, dark = false) {
  const vars = `--accent:${ctx.theme.accent};--deep:${ctx.theme.deep};--on-accent:${ctx.theme.onAccent}`;
  const bar = ctx.progress ? progressBar(ctx.index, ctx.total) : "";
  return `<section class="slide ${cls}${dark ? " dark" : ""} size-${ctx.size.name}" style="width:${ctx.size.w}px;height:${ctx.size.h}px;${vars}">${bar}${inner}</section>`;
}
var BASE_CSS = `
.slide { position: relative; overflow: hidden; flex: none; }
`;

// src/render/escape.ts
var ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
function fill(text, stats, lang) {
  return escapeHtml(fillPlaceholders(text, stats, lang));
}
function num(n, lang, digits = 0) {
  return new Intl.NumberFormat(lang === "nl" ? "nl-BE" : "en-US", { maximumFractionDigits: digits }).format(n);
}
function compact(n, lang) {
  const units = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, u] of units) if (n >= v) return `${num(n / v, lang, n / v < 100 ? 1 : 0)}${u}`;
  return num(n, lang);
}

// src/render/i18n.ts
var STRINGS = {
  en: {
    tokensRead: "tokens read",
    tokensWritten: "tokens written",
    activeDays: (n, from, to) => `${n} active days, ${from} to ${to}`,
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
    days: (n) => `${n} days`,
    topLanguage: "top language",
    topTools: "top tools",
    verdict: "verdict",
    reading: (n) => `reading ${n} days of logs...`,
    done: "done",
    msgs: "msgs",
    level: "LV",
    weakness: "Weakness",
    nemesis: "Nemesis",
    rarity: { common: "Common", rare: "Rare", legendary: "Legendary" },
    classLine: (lang, n, y) => `${lang} class. Summoned ${n} times in ${y}.`,
    messagesPerMonth: "messages per month",
    save: "Save image",
    screenshot: "Screenshot this slide to share it",
    next: "Next",
    previous: "Previous"
  },
  nl: {
    tokensRead: "tokens gelezen",
    tokensWritten: "tokens geschreven",
    activeDays: (n, from, to) => `${n} actieve dagen, ${from} tot ${to}`,
    sessions: "Sessies",
    messages: "Berichten",
    bash: "Bash-commando's",
    testRuns: "Testruns",
    commits: "Commits",
    please: '"alsjeblieft"',
    noWait: '"nee wacht"',
    apiValue: "API-waarde",
    youPaid: "Jij betaalde",
    aPlan: "een abonnement",
    excludes: (n) => `zonder ${n} model${n === 1 ? "" : "len"} zonder prijs`,
    apiNote: "Schatting aan Anthropic API-prijzen",
    receiptThanks: "Bedankt om te bouwen.",
    receiptYear: (y) => `Claude Code, jaar ${y}`,
    busiestDay: "drukste dag",
    streak: "langste reeks",
    days: (n) => `${n} dagen`,
    topLanguage: "toptaal",
    topTools: "top tools",
    verdict: "oordeel",
    reading: (n) => `${n} dagen logs lezen...`,
    done: "klaar",
    msgs: "ber.",
    level: "LV",
    weakness: "Zwakte",
    nemesis: "Aartsvijand",
    rarity: { common: "Gewoon", rare: "Zeldzaam", legendary: "Legendarisch" },
    classLine: (lang, n, y) => `${lang}-klasse. ${n} keer opgeroepen in ${y}.`,
    messagesPerMonth: "berichten per maand",
    save: "Afbeelding opslaan",
    screenshot: "Maak een screenshot van deze slide om te delen",
    next: "Volgende",
    previous: "Vorige"
  }
};
var t = (lang) => STRINGS[lang];
function shortDate(date, lang) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "nl" ? "nl-BE" : "en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
function shortMonth(month, lang) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "nl" ? "nl-BE" : "en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
}

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

// src/render/slides/card.ts
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
  return `<svg viewBox="0 0 12 12" width="360" height="360" shape-rendering="crispEdges" role="img" aria-label="creature">${rects.join("")}</svg>`;
}
function render(ctx) {
  const { stats, lang, copy } = ctx;
  const p = copy.persona;
  if (!p || !p.moves || p.moves.length === 0) return null;
  const s = t(lang);
  const lv = level(stats.tokens.yearTotal);
  const rare = s.rarity[rarity(stats)];
  const moves = p.moves.map((m) => `<div class="move"><b>${fill(m.name, stats, lang)}</b><span>${fill(m.value, stats, lang)}</span><p>${fill(m.text, stats, lang)}</p></div>`).join("");
  const typeLine = s.classLine(escapeHtml(stats.files.topLanguage ?? "Polyglot"), String(stats.activity.sessions), stats.year);
  const cardHtml = `<div class="card"><div class="face">
    <div class="top"><div class="name">${fill(p.className, stats, lang)}</div><div class="lv">${s.level} <b>${lv}</b></div></div>
    <div class="window">${sprite(stats, ctx.theme.accent, ctx.theme.deep)}</div>
    <div class="type">${typeLine}</div>
    ${moves}
    <div class="bottom"><span>${s.weakness}: ${fill(p.weakness, stats, lang)}</span><span>${s.nemesis}: ${fill(p.nemesis, stats, lang)}</span><span>${rare}</span></div>
  </div></div>`;
  const side = ctx.size.name === "landscape" ? `<div class="side"><div class="sname">${fill(p.className, stats, lang)}</div><div class="smeta">${s.level} ${lv}, ${rare}</div><p>${fill(p.specialMove, stats, lang)}</p></div>` : "";
  return { css: CSS, html: frame(ctx, "s-card", `<div class="stage">${cardHtml}</div>${side}`) };
}
var CSS = `
.s-card { background: #E9ECF1; font-family: Archivo, sans-serif; }
.s-card .stage { position: absolute; inset: 0; display: grid; place-items: center; }
.s-card .card { width: 860px; height: 1220px; border-radius: 40px; padding: 26px; background: var(--deep); box-shadow: 0 60px 110px rgba(16,21,28,.35); transform: rotate(1.2deg); }
.s-card .face { height: 100%; border-radius: 22px; background: #F7F8FA; padding: 34px 40px; display: flex; flex-direction: column; }
.s-card .top { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.s-card .name { font: 900 88px/1 "Big Shoulders Display", sans-serif; color: #10151C; }
.s-card .lv { font-weight: 700; font-size: 40px; color: var(--deep); white-space: nowrap; }
.s-card .lv b { font-size: 64px; }
.s-card .window { margin-top: 22px; height: 470px; border-radius: 14px; border: 6px solid var(--deep); background: color-mix(in oklab, var(--accent) 14%, #F7F8FA); display: grid; place-items: center; }
.s-card .type { font-size: 30px; line-height: 1.3; color: #4B5563; margin: 14px 0 18px; }
.s-card .move { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding: 18px 0; border-top: 3px solid #D5DAE1; }
.s-card .move b { font-size: 46px; font-weight: 800; color: #10151C; }
.s-card .move span { font-size: 54px; font-weight: 900; color: var(--deep); }
.s-card .move p { grid-column: 1 / -1; margin: 6px 0 0; font-size: 30px; color: #4B5563; }
.s-card .bottom { margin-top: auto; display: flex; justify-content: space-between; gap: 16px; font-size: 26px; line-height: 1.3; color: #4B5563; border-top: 3px solid #D5DAE1; padding-top: 16px; }
.s-card.size-feed .card { zoom: .98; }
.s-card.size-landscape .stage { right: auto; width: 540px; }
.s-card.size-landscape .card { zoom: .48; }
.s-card .side { position: absolute; left: 580px; right: 64px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; color: #10151C; }
.s-card .sname { font: 900 104px/.95 "Big Shoulders Display", sans-serif; }
.s-card .smeta { font-size: 34px; font-weight: 700; color: var(--deep); margin-top: 18px; }
.s-card .side p { font-size: 32px; line-height: 1.3; color: #4B5563; margin: 24px 0 0; }
`;

// src/render/slides/growth.ts
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
function render2(ctx) {
  const { stats, lang, copy } = ctx;
  const g = stats.activity.growth;
  if (!g || g.factor < 2 || !copy.growthLine || !copy.profile) return null;
  const series = monthSeries(stats.activity.byMonth);
  const max = Math.max(...series.map((m) => m.messages), 1);
  const W = 952, H = 560;
  const x = (i) => 20 + i * ((W - 40) / Math.max(1, series.length - 1));
  const y = (v) => H - 80 - (H - 160) * (v / max);
  const pts = series.map((m, i) => [x(i), y(m.messages)]);
  const line = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
  const area = `M${pts[0][0].toFixed(1)} ${H - 80} L` + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + ` L${pts.at(-1)[0].toFixed(1)} ${H - 80} Z`;
  const pk = series.findIndex((m) => m.month === g.peak.month);
  const labels = series.map((m, i) => `<text x="${x(i).toFixed(1)}" y="${H - 24}" text-anchor="middle">${shortMonth(m.month, lang)}</text>`).join("");
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${num(g.peak.messages, lang)}">
    <path d="${area}" fill="color-mix(in oklab, var(--accent) 16%, #FFFFFF)"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="draw"/>
    <circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="14" fill="#10151C"/>
    ${pk >= 0 ? `<circle cx="${pts[pk][0].toFixed(1)}" cy="${pts[pk][1].toFixed(1)}" r="14" fill="#10151C"/><text x="${(pts[pk][0] - 24).toFixed(1)}" y="${(pts[pk][1] - 28).toFixed(1)}" text-anchor="end" class="peak">${num(g.peak.messages, lang)}</text>` : ""}
    ${labels}
  </svg>`;
  const strengths = copy.profile.strengths.slice(0, 3).map((st) => `<li>${fill(st.text, stats, lang)}</li>`).join("");
  const inner = `${chart}<div class="copy"><h2>${fill(copy.growthLine, stats, lang)}</h2><ul>${strengths}</ul></div>`;
  return { css: CSS2, html: frame(ctx, "s-grow", inner) };
}
var CSS2 = `
.s-grow { background: #FFFFFF; color: #10151C; font-family: Archivo, sans-serif; }
.s-grow .chart { position: absolute; top: 120px; left: 64px; width: 952px; height: 560px; overflow: visible; }
.s-grow .chart text { font-size: 30px; fill: #4B5563; font-family: Archivo, sans-serif; }
.s-grow .chart .peak { fill: #10151C; font-weight: 700; }
.s-grow .draw { stroke-dasharray: 1; stroke-dashoffset: 0; animation: pf-draw 1.4s cubic-bezier(.22,1,.36,1) both; }
@keyframes pf-draw { from { stroke-dashoffset: 1; } }
.s-grow .copy { position: absolute; left: 72px; right: 72px; top: 780px; }
.s-grow h2 { margin: 0; font-weight: 900; font-size: 128px; line-height: .94; letter-spacing: -.02em; }
.s-grow ul { list-style: none; padding: 0; margin: 56px 0 0; display: grid; gap: 0; }
.s-grow li { font-size: 44px; line-height: 1.25; padding: 26px 0; border-top: 3px solid #E3E7EC; color: #374151; }
.s-grow.size-feed .chart { top: 90px; height: 420px; }
.s-grow.size-feed .copy { top: 560px; }
.s-grow.size-feed h2 { font-size: 96px; }
.s-grow.size-feed li { font-size: 36px; padding: 18px 0; }
.s-grow.size-landscape .chart { top: 80px; left: 40px; width: 600px; height: 400px; }
.s-grow.size-landscape .copy { left: 680px; right: 48px; top: 70px; }
.s-grow.size-landscape h2 { font-size: 64px; }
.s-grow.size-landscape ul { margin-top: 28px; }
.s-grow.size-landscape li { font-size: 26px; padding: 14px 0; }
`;

// src/render/slides/receipt.ts
var DAY = 864e5;
var toMs = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
function render3(ctx) {
  const { stats, lang, copy } = ctx;
  const daily = stats.activity.daily;
  if (daily.length === 0) return null;
  const s = t(lang);
  const line = (label, value, cls = "") => `<div class="ln${cls}"><span>${label}</span><span>${value}</span></div>`;
  const items = [
    line(s.sessions, num(stats.activity.sessions, lang)),
    line(s.messages, num(stats.activity.messages, lang)),
    stats.tools.bash ? line(s.bash, num(stats.tools.bash, lang)) : "",
    stats.tools.testRuns ? line(s.testRuns, num(stats.tools.testRuns, lang)) : "",
    stats.tools.commits ? line(s.commits, num(stats.tools.commits, lang)) : "",
    stats.prompts.count ? line(escapeHtml(s.please), num(stats.prompts.politeness, lang)) : "",
    stats.prompts.count ? line(escapeHtml(s.noWait), num(stats.prompts.corrections, lang)) : ""
  ].join("");
  const tokens = [
    stats.tokens.yearTotal ? line(s.tokensRead.replace(/^./, (c) => c.toUpperCase()), compact(stats.tokens.yearTotal, lang)) : "",
    stats.tokens.yearOutput ? line(s.tokensWritten.replace(/^./, (c) => c.toUpperCase()), compact(stats.tokens.yearOutput, lang)) : ""
  ].join("");
  const api = stats.apiValue && stats.apiValue.usd >= 1 ? line(s.apiValue, `$${num(Math.round(stats.apiValue.usd), lang)}`, " tot") + line(s.youPaid, s.aPlan) + `<div class="note">${s.apiNote}${stats.apiValue.skippedModels.length ? `, ${s.excludes(stats.apiValue.skippedModels.length)}` : ""}</div>` : "";
  const footer = copy.vibe !== "professional" && copy.receiptFooter ? fill(copy.receiptFooter, stats, lang) : s.receiptThanks;
  const first = toMs(daily[0].date);
  const days = Math.round((toMs(daily.at(-1).date) - first) / DAY) + 1;
  const byDate = new Map(daily.map((d) => [d.date, d.messages]));
  const max = Math.max(...daily.map((d) => d.messages), 1);
  const bars = Array.from({ length: days }, (_, i) => {
    const v = byDate.get(new Date(first + i * DAY).toISOString().slice(0, 10)) ?? 0;
    return `<i class="bar" style="height:${Math.max(6, Math.round(100 * Math.sqrt(v / max)))}%"></i>`;
  }).join("");
  const inner = `<div class="slip">
    <h3>PROMPTFOLIO</h3>
    <div class="c">${s.receiptYear(stats.year)}<br>${shortDate(daily[0].date, lang)} &ndash; ${shortDate(daily.at(-1).date, lang)}</div>
    <hr>${items}<hr>${tokens}${api}<hr>
    <div class="c">${footer}</div>
    <div class="bars">${bars}</div>
  </div>`;
  return { css: CSS3, html: frame(ctx, "s-rcpt", inner) };
}
var CSS3 = `
.s-rcpt { background: var(--accent); display: grid; place-items: center; }
.s-rcpt .slip { width: 820px; background: #FFFFFF; color: #111111; font: 400 34px/1.45 "IBM Plex Mono", monospace; padding: 72px 64px 90px;
  transform: rotate(-1.6deg); box-shadow: 0 50px 90px rgba(0,0,0,.28);
  -webkit-mask: radial-gradient(14px at 50% 100%, transparent 98%, #000) 0 0 / 40px 100% repeat-x;
          mask: radial-gradient(14px at 50% 100%, transparent 98%, #000) 0 0 / 40px 100% repeat-x; }
.s-rcpt h3 { font: 600 52px/1.1 "IBM Plex Mono", monospace; text-align: center; margin: 0 0 6px; }
.s-rcpt .c { text-align: center; }
.s-rcpt hr { border: 0; border-top: 3px dashed #111111; margin: 26px 0; }
.s-rcpt .ln { display: flex; justify-content: space-between; gap: 20px; }
.s-rcpt .tot { font-weight: 600; font-size: 44px; margin-top: 8px; }
.s-rcpt .note { font-size: 24px; color: #4B5563; margin-top: 6px; }
.s-rcpt .bars { display: flex; align-items: flex-end; gap: 2px; height: 110px; margin-top: 32px; }
.s-rcpt .bar { flex: 1; background: #111111; }
.s-rcpt.size-feed .slip { font-size: 28px; padding: 48px 56px 64px; width: 760px; }
.s-rcpt.size-feed h3 { font-size: 44px; }
.s-rcpt.size-feed hr { margin: 18px 0; }
.s-rcpt.size-feed .tot { font-size: 36px; }
.s-rcpt.size-feed .bars { height: 80px; margin-top: 22px; }
`;

// src/render/slides/terminal.ts
function toolName(name) {
  if (!name.startsWith("mcp:")) return name;
  const server = name.slice(4);
  return server === "connector" ? "Connector" : server.replace(/[_-]+/g, " ");
}
function render4(ctx) {
  const { stats, lang, copy } = ctx;
  if (stats.activity.sessions === 0 && stats.tools.calls === 0) return null;
  const s = t(lang);
  const row = (k, v, cls = "v") => `<div class="row"><span class="k">${k}</span><span class="${cls}">${v}</span></div>`;
  const top = stats.tools.top.slice(0, 4);
  const peak = top[0]?.count ?? 1;
  const tools = top.map((x) => `<div class="row"><span class="v name">${escapeHtml(toolName(x.name))}</span><span><i class="bar" style="width:${Math.max(3, Math.round(100 * x.count / peak))}%"></i></span></div>`).join("");
  const inner = `<div class="win">
    <div class="dots"><i></i><i></i><i></i></div>
    <div class="p">~ <b>$</b> /promptfolio --year ${stats.year}</div><br>
    <div class="k">${s.reading(num(stats.activity.activeDays, lang))}</div>
    <div class="k">${s.done}</div><br>
    ${row(s.sessions.toLowerCase(), num(stats.activity.sessions, lang))}
    ${stats.activity.busiestDay ? row(s.busiestDay, `${shortDate(stats.activity.busiestDay.date, lang)} (${num(stats.activity.busiestDay.messages, lang)} ${s.msgs})`) : ""}
    ${row(s.streak, s.days(num(stats.activity.longestStreakDays, lang)))}
    ${stats.files.topLanguage ? row(s.topLanguage, escapeHtml(stats.files.topLanguage), "hl") : ""}
    ${tools ? `<br><div class="k">${s.topTools}</div>${tools}` : ""}
    ${copy.verdict ? `<br><div class="k">${s.verdict}</div><div class="v verdict">${fill(copy.verdict, stats, lang)}</div>` : ""}
    <br><div class="p">~ <b>$</b> <span class="caret"></span></div>
  </div>`;
  return { css: CSS4, html: frame(ctx, "s-term", inner, true) };
}
var CSS4 = `
.s-term { background: #0D1117; color: #D7DEE8; font: 400 36px/1.5 "IBM Plex Mono", monospace; padding: 150px 70px; }
.s-term .win { border-radius: 24px; background: #161B22; border: 2px solid #262D37; padding: 44px 48px; height: 100%; overflow: hidden; }
.s-term .dots { display: flex; gap: 14px; margin-bottom: 40px; }
.s-term .dots i { width: 22px; height: 22px; border-radius: 50%; background: #2E3743; }
.s-term .p, .s-term .k { color: #8B97A7; }
.s-term .p b { color: #FFFFFF; font-weight: 600; }
.s-term .v { color: #FFFFFF; font-weight: 600; }
.s-term .hl { color: color-mix(in oklab, var(--accent) 60%, #FFFFFF); font-weight: 600; }
.s-term .row { display: grid; grid-template-columns: 360px 1fr; align-items: center; gap: 24px; }
.s-term .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-term .bar { display: block; height: 26px; border-radius: 3px; background: color-mix(in oklab, var(--accent) 60%, #FFFFFF); }
.s-term .verdict { max-width: 860px; }
.s-term .caret { display: inline-block; width: 20px; height: 40px; background: #D7DEE8; vertical-align: -8px; animation: pf-blink 1.1s steps(1) infinite; }
@keyframes pf-blink { 50% { opacity: 0; } }
`;

// src/render/slides/tokens.ts
var DAY2 = 864e5;
var toMs2 = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
var iso = (ms) => new Date(ms).toISOString().slice(0, 10);
function render5(ctx) {
  const { stats, lang } = ctx;
  if (stats.tokens.yearTotal <= 0 || stats.activity.daily.length === 0) return null;
  const s = t(lang);
  const daily = stats.activity.daily;
  const byDate = new Map(daily.map((d) => [d.date, d.messages]));
  const max = Math.max(...daily.map((d) => d.messages), 1);
  const first = toMs2(daily[0].date);
  const start = first - (new Date(first).getUTCDay() + 6) % 7 * DAY2;
  const end = toMs2(daily.at(-1).date);
  const weeks = Math.floor((end - start) / DAY2 / 7) + 1;
  const width = ctx.size.w - 128;
  const cell = Math.max(8, Math.min(26, Math.floor((width - (weeks - 1) * 5) / weeks)));
  const cells = [];
  const months = [];
  let lastLabel = -Infinity;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = iso(start + (w * 7 + d) * DAY2);
      const v = byDate.get(date) ?? 0;
      const pct = v ? Math.round(18 + 82 * Math.sqrt(v / max)) : 0;
      cells.push(`<i class="cell" style="grid-column:${w + 1};grid-row:${d + 1}${v ? `;background:color-mix(in oklab, var(--accent) ${pct}%, #EEF1F5)` : ""}"></i>`);
      const left = w * (cell + 5);
      if ((date.endsWith("-01") || w === 0 && d === 0) && left - lastLabel >= 60) {
        months.push(`<span style="left:${left}px">${shortMonth(date.slice(0, 7), lang)}</span>`);
        lastLabel = left;
      }
    }
  }
  const read = compact(stats.tokens.yearTotal, lang);
  const written = stats.tokens.yearOutput ? compact(stats.tokens.yearOutput, lang) : null;
  const inner = `
    <div class="copy">
      <div class="num">${read}</div><div class="unit">${s.tokensRead}</div>
      ${written ? `<div class="num accent">${written}</div><div class="unit">${s.tokensWritten}</div>` : ""}
      ${ctx.copy.tokensLine ? `<p class="say">${fill(ctx.copy.tokensLine, stats, lang)}</p>` : ""}
    </div>
    <div class="heat" style="grid-template-columns:repeat(${weeks},${cell}px);grid-template-rows:repeat(7,${cell}px)">${cells.join("")}</div>
    <div class="months">${months.join("")}</div>
    <p class="foot">${s.activeDays(num(stats.activity.activeDays, lang), shortDate(daily[0].date, lang), shortDate(daily.at(-1).date, lang))}</p>`;
  return { css: CSS5, html: frame(ctx, "s-tok", inner) };
}
var CSS5 = `
.s-tok { background: #FFFFFF; color: #10151C; font-family: Archivo, sans-serif; }
.s-tok .copy { position: absolute; left: 64px; right: 64px; top: 140px; }
.s-tok .num { font-weight: 900; font-size: 300px; line-height: .82; letter-spacing: -.03em; }
.s-tok .num.accent { color: var(--accent); margin-top: 56px; }
.s-tok .unit { font-size: 46px; font-weight: 600; margin-top: 18px; }
.s-tok .say { font-size: 52px; line-height: 1.2; font-weight: 500; margin: 64px 0 0; max-width: 900px; }
.s-tok .heat { position: absolute; left: 64px; bottom: 230px; display: grid; gap: 5px; }
.s-tok .cell { border-radius: 5px; background: #EEF1F5; }
.s-tok .months { position: absolute; left: 64px; right: 64px; bottom: 180px; height: 36px; font-size: 30px; color: #4B5563; }
.s-tok .months span { position: absolute; top: 0; }
.s-tok .foot { position: absolute; left: 64px; bottom: 90px; margin: 0; font-size: 34px; color: #4B5563; }
.s-tok.size-feed .num { font-size: 220px; }
.s-tok.size-feed .say { font-size: 44px; margin-top: 40px; }
`;

// src/render/cards.ts
var RENDERERS = {
  tokens: render5,
  receipt: render3,
  terminal: render4,
  card: render,
  growth: render2
};
function storySlides(vibe) {
  return vibe === "professional" ? ["tokens", "terminal", "receipt", "growth"] : ["tokens", "receipt", "terminal", "card"];
}
var closer = (vibe) => vibe === "professional" ? "growth" : "card";
function shareCards(vibe, targets) {
  const out = [];
  const add = (slide, size) => {
    if (!out.some((o) => o.slide === slide && o.size === size)) out.push({ slide, size });
  };
  if (targets.includes("instagram")) for (const s of storySlides(vibe)) add(s, "story");
  if (targets.includes("linkedin")) {
    add(closer(vibe), "feed");
    add(closer(vibe), "landscape");
  }
  if (targets.includes("x") || targets.includes("discord")) add(closer(vibe), "landscape");
  add("receipt", "feed");
  return out;
}
function renderSlide(id, ctx) {
  return RENDERERS[id](ctx);
}
function slideCtx(stats, copy, size, extra = {}) {
  return { stats, copy, lang: copy.language, theme: languageColor(stats.files.topLanguage), size: SIZES[size], index: 0, total: 1, ...extra };
}
function cardDocument(id, size, stats, copy, assetsDir2) {
  const out = renderSlide(id, slideCtx(stats, copy, size));
  if (!out) return null;
  const { w, h } = SIZES[size];
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
  const theme = languageColor(stats.files.topLanguage);
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
</svg>
`;
}

// src/render/story.ts
function buildStory(opts) {
  const { stats, copy } = opts;
  const lang = copy.language;
  const s = t(lang);
  const ids = storySlides(copy.vibe).filter((id) => renderSlide(id, slideCtx(stats, copy, "story")) !== null);
  const css = /* @__PURE__ */ new Set([BASE_CSS, PROGRESS_CSS]);
  const slides = ids.map((id, i) => {
    const out = renderSlide(id, slideCtx(stats, copy, "story", { index: i, total: ids.length, progress: true }));
    css.add(out.css);
    const png = `cards/${id}-story.png`;
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
    var k = Math.min((window.innerWidth - 32) / 1080, (window.innerHeight - 72) / 1920);
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
var TARGETS = ["instagram", "linkedin", "x", "discord"];
var assetsDir = path3.join(path3.dirname(fileURLToPath(import.meta.url)), "..", "assets");
async function main() {
  const { values } = parseArgs({
    options: { dir: { type: "string" }, targets: { type: "string", default: "" }, "no-png": { type: "boolean", default: false } }
  });
  if (!values.dir) {
    console.error("Missing --dir <folder with stats.json and copy.json>.");
    return 1;
  }
  const dir = path3.resolve(values.dir);
  const targets = values.targets.split(",").map((s) => s.trim()).filter(Boolean);
  const unknown = targets.filter((x) => !TARGETS.includes(x));
  if (unknown.length) {
    console.error(`Unknown --targets: ${unknown.join(", ")} (use ${TARGETS.join(", ")})`);
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
  const pngs = /* @__PURE__ */ new Set();
  const browser = values["no-png"] || process.env.PROMPTFOLIO_BROWSER === "none" ? null : findBrowser({ platform: process.platform, env: process.env, exists: fs3.existsSync });
  if (!browser && !values["no-png"]) console.log("No Chrome, Edge or Brave found: PNGs skipped, story.html still works.");
  for (const { slide, size } of shareCards(copy.vibe, targets)) {
    const html = cardDocument(slide, size, stats, copy, assetsDir);
    if (!html) continue;
    const htmlPath = path3.join(cardsDir, `${slide}-${size}.html`);
    fs3.writeFileSync(htmlPath, html);
    if (browser) {
      const png = htmlPath.replace(/\.html$/, ".png");
      try {
        await screenshot({ browser, htmlPath, outPng: png, width: SIZES[size].w, height: SIZES[size].h });
        pngs.add(`cards/${slide}-${size}.png`);
        written.push(png);
      } catch (err) {
        console.log(`Could not render ${path3.basename(png)}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  const svg = readmeCard({ stats, copy, assetsDir });
  const svgPath = path3.join(dir, "readme-card.svg");
  fs3.writeFileSync(svgPath, svg);
  written.push(svgPath);
  if (browser) {
    const wrap = path3.join(cardsDir, "readme-card.html");
    fs3.writeFileSync(wrap, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:400px;overflow:hidden}</style></head><body>${svg}</body></html>`);
    const png = path3.join(dir, "readme-card.png");
    try {
      await screenshot({ browser, htmlPath: wrap, outPng: png, width: 1200, height: 400 });
      written.push(png);
    } catch (err) {
      console.log(`Could not render readme-card.png: ${err instanceof Error ? err.message : err}`);
    }
  }
  const storyPath = path3.join(dir, "story.html");
  fs3.writeFileSync(storyPath, buildStory({ stats, copy, assetsDir, pngs }));
  written.unshift(storyPath);
  for (const f of written) console.log(f);
  return 0;
}
main().then((code) => {
  process.exitCode = code;
}, (err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

// Built from src/cli by esbuild. Do not edit; run `npm run build`.

// src/cli/validate.ts
import fs from "node:fs";

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
function resolve(stats, path) {
  let v = stats;
  for (const key of path.split(".")) {
    if (v === null || v === void 0) return void 0;
    if (Array.isArray(v) && key === "length") v = v.length;
    else if (typeof v === "object" && Object.prototype.hasOwnProperty.call(v, key)) v = v[key];
    else return void 0;
  }
  return typeof v === "number" || typeof v === "string" ? v : void 0;
}
function format(path, value, language) {
  if (typeof value === "string") {
    if (path.endsWith(".month") && /^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return new Intl.DateTimeFormat(language === "nl" ? "nl-BE" : "en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
    }
    return value;
  }
  if (path.endsWith("Share") && value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat(language === "nl" ? "nl-BE" : "en-US", { maximumFractionDigits: 1 }).format(value);
}
function fillPlaceholders(text, stats, language) {
  return text.replace(PLACEHOLDER_RE, (whole, path) => {
    const v = resolve(stats, path);
    return v === void 0 ? whole : format(path, v, language);
  });
}
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function validateCopy(copy, stats) {
  const errors = [];
  if (!isObj(copy)) return { ok: false, errors: ["copy: must be a JSON object"] };
  const language = copy.language === "nl" ? "nl" : "en";
  const text = (path, value, limit) => {
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${path}: must be a non-empty string`);
      return;
    }
    for (const [, p] of value.matchAll(PLACEHOLDER_RE)) {
      if (resolve(stats, p) === void 0) errors.push(`${path}: placeholder {${p}} does not resolve to a number or string in stats`);
    }
    if (/\d/.test(value.replace(PLACEHOLDER_RE, ""))) errors.push(`${path}: contains a digit outside a placeholder; use a {placeholder}`);
    if (scanSecrets(value)) errors.push(`${path}: looks like it contains a secret or personal data`);
    const filled = fillPlaceholders(value, stats, language);
    if (filled.length > COPY_LIMITS[limit]) errors.push(`${path}: too long (${filled.length} > ${COPY_LIMITS[limit]} characters after filling)`);
  };
  if (copy.schemaVersion !== 2) errors.push("schemaVersion: must be 2");
  if (copy.language !== "en" && copy.language !== "nl") errors.push('language: must be "en" or "nl"');
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

// src/cli/validate.ts
var [copyPath, statsPath] = process.argv.slice(2);
if (!copyPath || !statsPath) {
  console.error("Usage: node validate.mjs <copy.json> <stats.json>");
  process.exitCode = 1;
} else {
  try {
    const result = validateCopy(JSON.parse(fs.readFileSync(copyPath, "utf8")), JSON.parse(fs.readFileSync(statsPath, "utf8")));
    if (result.ok) console.log("OK");
    else for (const e of result.errors) console.log(e);
    process.exitCode = result.ok ? 0 : 1;
  } catch (err) {
    console.log(`Could not read input: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}

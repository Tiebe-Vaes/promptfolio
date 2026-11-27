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
  const list = (path, value, min, max) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      errors.push(`${path}: needs ${min === max ? min : `${min}-${max}`} entries`);
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
      const need = Math.min(3, candidates.size);
      list("profile.strengths", profile.strengths, need, need).forEach((s, i) => {
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
  if (copy.vibe === "professional" && stats.activity.growth && stats.activity.growth.factor >= 2) text("growthLine", copy.growthLine, "growthLine");
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
        const v = value ? resolve(stats, value[1]) : void 0;
        if (typeof v !== "number" || v <= 0) errors.push(`persona.moves.${i}.value: must be exactly one {placeholder} that resolves to a number above zero`);
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

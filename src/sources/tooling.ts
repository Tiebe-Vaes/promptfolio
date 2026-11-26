import fs from 'node:fs';
import path from 'node:path';

export interface Tooling {
  skills: number;
  agents: number;
  hooks: number;
  plugins: number;
  cleanupPeriodDays: number | null;
}

async function entries(dir: string): Promise<fs.Dirent[]> {
  try {
    return await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Counts the user's own skills, agents, hooks and enabled plugins, plus the log retention setting. */
export async function readTooling(claudeDir: string): Promise<Tooling> {
  let skills = 0;
  for (const e of await entries(path.join(claudeDir, 'skills'))) {
    if (e.isDirectory() && fs.existsSync(path.join(claudeDir, 'skills', e.name, 'SKILL.md'))) skills++;
  }
  const agents = (await entries(path.join(claudeDir, 'agents'))).filter(e => e.isFile() && e.name.endsWith('.md')).length;

  let settings: any = {};
  try {
    settings = JSON.parse(await fs.promises.readFile(path.join(claudeDir, 'settings.json'), 'utf8')) ?? {};
  } catch { /* no or unreadable settings: counts stay 0 */ }

  let hooks = 0;
  if (settings.hooks && typeof settings.hooks === 'object') {
    for (const groups of Object.values(settings.hooks)) {
      for (const g of Array.isArray(groups) ? groups : []) hooks += Array.isArray((g as any)?.hooks) ? (g as any).hooks.length : 0;
    }
  }
  const plugins = settings.enabledPlugins && typeof settings.enabledPlugins === 'object'
    ? Object.values(settings.enabledPlugins).filter(v => v === true).length
    : 0;
  const c = settings.cleanupPeriodDays;
  return { skills, agents, hooks, plugins, cleanupPeriodDays: typeof c === 'number' && Number.isFinite(c) ? c : null };
}

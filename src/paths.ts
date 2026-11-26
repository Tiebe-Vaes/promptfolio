import path from 'node:path';

export function resolveClaudeDir(env: NodeJS.ProcessEnv, home: string): string {
  return env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
}

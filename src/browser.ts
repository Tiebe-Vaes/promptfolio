import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WIN_CANDIDATES: [envVar: string, rel: string][] = [
  ['ProgramFiles(x86)', 'Microsoft\\Edge\\Application\\msedge.exe'],
  ['ProgramFiles', 'Microsoft\\Edge\\Application\\msedge.exe'],
  ['ProgramFiles', 'Google\\Chrome\\Application\\chrome.exe'],
  ['ProgramFiles(x86)', 'Google\\Chrome\\Application\\chrome.exe'],
  ['LOCALAPPDATA', 'Google\\Chrome\\Application\\chrome.exe'],
  ['ProgramFiles', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'],
  ['LOCALAPPDATA', 'Chromium\\Application\\chrome.exe'],
];

const MAC_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const LINUX_NAMES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'brave-browser'];

/** First installed Chromium-family browser, or null. `PROMPTFOLIO_BROWSER` wins when it exists. */
export function findBrowser(opts: { platform: NodeJS.Platform; env: NodeJS.ProcessEnv; exists: (p: string) => boolean }): string | null {
  const { platform, env, exists } = opts;
  const candidates: string[] = [];
  if (env.PROMPTFOLIO_BROWSER) candidates.push(env.PROMPTFOLIO_BROWSER);
  if (platform === 'win32') {
    for (const [v, rel] of WIN_CANDIDATES) if (env[v]) candidates.push(path.win32.join(env[v]!, rel));
  } else if (platform === 'darwin') {
    candidates.push(...MAC_CANDIDATES);
  } else {
    const dirs = (env.PATH ?? '').split(path.posix.delimiter).filter(Boolean);
    for (const name of LINUX_NAMES) for (const dir of dirs) candidates.push(path.posix.join(dir, name));
  }
  return candidates.find(exists) ?? null;
}

/** file:// URL for a local path; handles Windows drive paths on any OS. */
function fileUrl(p: string): string {
  if (/^[A-Za-z]:[\\/]/.test(p)) {
    return 'file:///' + encodeURI(p.replaceAll('\\', '/')).replaceAll('#', '%23').replaceAll('?', '%3F');
  }
  return pathToFileURL(p).href;
}

export function screenshotArgs(opts: { htmlPath: string; outPng: string; width: number; height: number; userDataDir: string }): string[] {
  return [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${opts.userDataDir}`,
    `--screenshot=${opts.outPng}`,
    `--window-size=${opts.width},${opts.height}`,
    '--virtual-time-budget=3000',
    fileUrl(opts.htmlPath),
  ];
}

/** Width and height from a PNG's IHDR chunk, or null if not a PNG. */
export function pngSize(buf: Buffer): { width: number; height: number } | null {
  const sig = '89504e470d0a1a0a';
  if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== sig) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Renders `htmlPath` to `outPng` with a headless browser. A fresh profile keeps an already-open browser out of the way. */
export async function screenshot(opts: {
  browser: string; htmlPath: string; outPng: string; width: number; height: number; timeoutMs?: number;
}): Promise<void> {
  const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'promptfolio-browser-'));
  try {
    await fs.promises.rm(opts.outPng, { force: true });
    await new Promise<void>((resolve, reject) => {
      execFile(
        opts.browser,
        screenshotArgs({ ...opts, userDataDir }),
        { timeout: opts.timeoutMs ?? 30_000, windowsHide: true },
        err => (err ? reject(new Error(`Browser screenshot failed: ${err.message}`)) : resolve()),
      );
    });
    const size = fs.existsSync(opts.outPng) ? pngSize(await fs.promises.readFile(opts.outPng)) : null;
    if (!size) throw new Error(`Browser did not write a PNG to ${opts.outPng}`);
    if (size.width !== opts.width || size.height !== opts.height) {
      throw new Error(`PNG is ${size.width}x${size.height}, expected ${opts.width}x${opts.height}`);
    }
  } finally {
    await fs.promises.rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}

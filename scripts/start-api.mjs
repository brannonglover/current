#!/usr/bin/env node
/**
 * Start the backend dev server unless a healthy API is already on port 3001.
 * Avoids EADDRINUSE when a second terminal runs `npm run api`.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeApi } from './api-check.mjs';
import { freePort } from './free-port.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const API_PORT = 3001;

function mergeNodeOptions(existing, flag) {
  const parts = (existing ?? '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.includes(flag)) parts.push(flag);
  return parts.join(' ');
}

async function main() {
  const existing = await probeApi();
  if (existing.ok) {
    console.log(
      `API already running at http://127.0.0.1:${API_PORT} (${existing.body?.articleCount ?? '?'} articles).`,
    );
    console.log('Use `npm run api:stop` to stop it, or `npm run api:restart` to restart.');
    return;
  }

  if (existing.pids?.length) {
    console.warn(
      `Port ${API_PORT} is in use but /api/health failed (${existing.error ?? existing.status}). Restarting…`,
    );
    freePort(API_PORT);
    await new Promise((r) => setTimeout(r, 800));
  }

  if (process.platform === 'darwin') {
    try {
      const { execSync } = await import('node:child_process');
      execSync('ulimit -n 10240', { stdio: 'ignore' });
    } catch {
      // best effort
    }
  }

  console.log(`Starting API on http://0.0.0.0:${API_PORT} (WATCHPACK_POLLING enabled)…`);

  const child = spawn('npm', ['run', 'dev', '--prefix', 'backend'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, '--use-system-ca'),
      WATCHPACK_POLLING: 'true',
      CHOKIDAR_USEPOLLING: 'true',
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

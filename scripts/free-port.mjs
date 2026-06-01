#!/usr/bin/env node
/**
 * Stop processes listening on a TCP port (macOS/Linux: lsof).
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function getPidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => Number.parseInt(p, 10))
      .filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

export function freePort(port, { signal = 'SIGTERM' } = {}) {
  const pids = getPidsOnPort(port);
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
      console.log(`Stopped PID ${pid} (port ${port})`);
    } catch (error) {
      console.warn(`Could not stop PID ${pid}:`, error instanceof Error ? error.message : error);
    }
  }
  return pids.length;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number.parseInt(process.argv[2] ?? '3001', 10);
  const count = freePort(port);
  if (count === 0) console.log(`No process listening on port ${port}`);
}

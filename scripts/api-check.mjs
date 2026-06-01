#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

import { freePort, getPidsOnPort } from './free-port.mjs';

const API_PORT = Number.parseInt(process.env.API_PORT ?? '3001', 10);
const BASE = `http://127.0.0.1:${API_PORT}`;

async function fetchOk(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) return null;
  return res.json().catch(() => ({}));
}

export async function waitForApi({ timeoutMs = 60_000, intervalMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const body = await fetchOk('/api/health');
    if (body) return body;
    const articles = await fetchOk('/api/articles?limit=1');
    if (articles?.articles) return { ok: true, articleCount: articles.articles.length, legacy: true };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`API did not become ready at ${BASE} within ${timeoutMs}ms`);
}

export async function probeApi() {
  try {
    const health = await fetchOk('/api/health');
    if (health) {
      return { ok: true, status: 200, body: health, pids: getPidsOnPort(API_PORT) };
    }
    const articles = await fetchOk('/api/articles?limit=1');
    if (articles?.articles) {
      return {
        ok: true,
        status: 200,
        body: { ok: true, articleCount: articles.articles.length, legacyProbe: true },
        pids: getPidsOnPort(API_PORT),
      };
    }
    return { ok: false, status: 404, pids: getPidsOnPort(API_PORT) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      pids: getPidsOnPort(API_PORT),
    };
  }
}

async function main() {
  const cmd = process.argv[2] ?? 'probe';
  if (cmd === 'wait') {
    const body = await waitForApi();
    console.log(JSON.stringify(body, null, 2));
    return;
  }
  if (cmd === 'stop') {
    freePort(API_PORT);
    return;
  }
  const result = await probeApi();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

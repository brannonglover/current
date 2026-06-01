import { getIngestIntervalMs, runIngestCycle } from '../lib/ingest-scheduler';

const intervalMs = getIngestIntervalMs();

console.log(`[ingest-watch] polling every ${Math.round(intervalMs / 60000)} minutes`);

async function tick() {
  try {
    const result = await runIngestCycle();
    console.log(
      `[ingest-watch] ${result.itemsInserted} new, ${result.itemsUpdated} updated, ${result.itemsPruned} pruned`,
    );
  } catch (error) {
    console.error('[ingest-watch] failed:', error);
  }
}

await tick();
setInterval(tick, intervalMs);

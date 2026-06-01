import { ingestFeeds } from '../lib/ingest';

async function main() {
  console.log('Starting RSS ingest...');
  const result = await ingestFeeds();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

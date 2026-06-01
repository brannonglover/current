export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureFreshArticles } = await import('./lib/ingest-scheduler');
    ensureFreshArticles().catch((error) => {
      console.error('[ingest] startup refresh failed:', error);
    });
  }
}

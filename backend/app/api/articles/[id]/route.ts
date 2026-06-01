import { NextRequest } from 'next/server';

import { corsHeaders, jsonResponse } from '@/lib/cors';
import { getArticleById } from '@/lib/db';
import { ensureFreshArticles } from '@/lib/ingest-scheduler';

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get('origin');
  const { id } = await params;

  try {
    await ensureFreshArticles();

    const article = getArticleById(id);
    if (!article) {
      return jsonResponse({ error: 'Article not found' }, origin, 404);
    }
    return jsonResponse({ article }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load article';
    return jsonResponse({ error: message }, origin, 500);
  }
}

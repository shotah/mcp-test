import OpenAI from 'openai';
import { Logger } from '../logger';
import { Env, SearchRequest, SearchResponse } from '../types';

/**
 * Search documents handler
 */
export async function handleSearch(
  request: Request,
  supabase: any,
  openai: OpenAI,
  corsHeaders: Record<string, string>,
  env: Env
): Promise<Response> {
  Logger.database('Starting search request');

  const {
    query,
    limit = 10,
    threshold = 0.5,
  } = (await request.json()) as SearchRequest;

  if (!query) {
    Logger.warning('Search request missing query');
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  Logger.ai('Generating query embedding', { queryLength: query.length });

  // Generate embedding for the query
  const embedding = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    input: query,
  });

  Logger.database('Searching documents', { limit, threshold });

  // Search for similar documents
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: embedding.data[0].embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    Logger.error('Search error', error);
    throw new Error(`Search error: ${error.message}`);
  }

  const response: SearchResponse = { results: data };

  Logger.success('Search completed', { resultCount: data?.length || 0 });

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import OpenAI from 'openai';
import { Logger } from '../logger';
import { EmbedRequest, EmbedResponse, Env } from '../types';

/**
 * Embed text handler
 */
export async function handleEmbed(
  request: Request,
  openai: OpenAI,
  corsHeaders: Record<string, string>,
  env: Env
): Promise<Response> {
  Logger.ai('Starting embed request');

  const { text } = (await request.json()) as EmbedRequest;

  if (!text) {
    Logger.warning('Embed request missing text');
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  Logger.ai('Generating embedding', { textLength: text.length });

  const embedding = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    input: text,
  });

  const response: EmbedResponse = {
    embedding: embedding.data[0].embedding,
  };

  Logger.success('Embedding generated', {
    dimensions: embedding.data[0].embedding.length,
  });

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Initialize Supabase client
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      // Route handling
      switch (url.pathname) {
        case '/health':
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case '/embed':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleEmbed(request, openai, corsHeaders);

        case '/search':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleSearch(request, supabase, openai, corsHeaders);

        case '/chat':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleChat(request, supabase, openai, corsHeaders);

        default:
          return new Response('Not found', {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

async function handleEmbed(
  request: Request,
  openai: OpenAI,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { text } = (await request.json()) as { text: string };

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  return new Response(
    JSON.stringify({
      embedding: embedding.data[0].embedding,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleSearch(
  request: Request,
  supabase: any,
  openai: OpenAI,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const {
    query,
    limit = 10,
    threshold = 0.5,
  } = (await request.json()) as {
    query: string;
    limit: number;
    threshold: number;
  };

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate embedding for the query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });

  // Search for similar documents
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: embedding.data[0].embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Search error: ${error.message}`);
  }

  return new Response(JSON.stringify({ results: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleChat(
  request: Request,
  supabase: any,
  openai: OpenAI,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { message, sessionId, userId } = (await request.json()) as {
    message: string;
    sessionId: string;
    userId: string;
  };

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get or create session
  let session;
  if (sessionId) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    session = data;
  } else {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (error) throw error;
    session = data;
  }

  // Get recent messages for context
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(10);

  // Search for relevant documents
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: message,
  });

  const { data: relevantDocs } = await supabase.rpc('search_documents', {
    query_embedding: embedding.data[0].embedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  // Build context from relevant documents
  const context =
    relevantDocs
      ?.map((doc: any) => `${doc.title}: ${doc.content}`)
      .join('\n\n') || '';

  // Prepare messages for OpenAI
  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI assistant. Use the following context to answer questions:

${context}

If you don't know the answer based on the context, say so. Be helpful and accurate.`,
  };

  const chatMessages = [
    systemMessage,
    ...(messages || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  // Get response from OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: chatMessages as any,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const assistantMessage = completion.choices[0].message.content;

  // Save messages to database
  await supabase.from('chat_messages').insert([
    { session_id: session.id, role: 'user', content: message },
    { session_id: session.id, role: 'assistant', content: assistantMessage },
  ]);

  return new Response(
    JSON.stringify({
      response: assistantMessage,
      sessionId: session.id,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

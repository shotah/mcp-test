import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  ALLOWED_ORIGINS?: string;
}

// Rate limiting storage
const rateLimit = new Map();

// Rate limiting function
async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 10; // 10 requests per minute

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const requests = rateLimit.get(ip);
  const recent = requests.filter((time: number) => now - time < window);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}

// Authentication validation function
async function validateAuth(
  request: Request,
  supabase: any
): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    // Get client IP with better fallback handling
    const getClientIP = (request: Request): string => {
      // Try multiple headers in order of preference
      const ip =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        request.headers.get('X-Client-IP');

      if (ip) return ip;

      // Generate unique identifier for unknown IPs
      // This ensures each unknown request gets its own rate limit
      return (
        'unknown-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substring(2, 11)
      );
    };

    const clientIP = getClientIP(request);

    // CORS headers - environment-specific domains
    const corsHeaders = {
      'Access-Control-Allow-Origin':
        env.ALLOWED_ORIGINS || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Rate limiting check
    if (!(await checkRateLimit(clientIP))) {
      return new Response('Rate limited', {
        status: 429,
        headers: corsHeaders,
      });
    }

    try {
      // Initialize Supabase client
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      // Authentication for protected endpoints
      let userId: string | null = null;
      if (['/chat', '/search'].includes(url.pathname)) {
        userId = await validateAuth(request, supabase);
        if (!userId) {
          return new Response('Unauthorized', {
            status: 401,
            headers: corsHeaders,
          });
        }
      }

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
          return handleChat(request, supabase, openai, corsHeaders, userId!);

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

// Input validation function
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Invalid message' };
  }

  if (data.message.length > 1000) {
    return { valid: false, error: 'Message too long' };
  }

  // Check for malicious content
  if (
    data.message.includes('<script>') ||
    data.message.includes('javascript:')
  ) {
    return { valid: false, error: 'Invalid content' };
  }

  return { valid: true };
}

async function handleChat(
  request: Request,
  supabase: any,
  openai: OpenAI,
  corsHeaders: Record<string, string>,
  userId: string
): Promise<Response> {
  const { message, sessionId } = (await request.json()) as {
    message: string;
    sessionId: string;
  };

  // Validate input
  const validation = validateInput({ message });
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get or create session (using authenticated userId)
  let session;
  if (sessionId) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId) // Ensure user owns the session
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

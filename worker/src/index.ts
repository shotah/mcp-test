import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  OPENAI_EMBEDDING_MODEL?: string;
  OPENAI_CHAT_MODEL?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Rate limiting storage
const rateLimit = new Map();

// Rate limiting function
async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 100; // 10 requests per minute

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
    console.log('🔥 WORKER REQUEST RECEIVED!');
    const url = new URL(request.url);
    const method = request.method;

    // Enhanced logging
    console.log(`🚀 [${new Date().toISOString()}] ${method} ${url.pathname}`);
    console.log(
      '📋 Request Headers:',
      Object.fromEntries(request.headers.entries())
    );
    console.log('🔧 Environment Variables:', {
      SUPABASE_URL: env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      OPENAI_API_KEY: env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
      ALLOWED_ORIGINS: env.ALLOWED_ORIGINS || 'Using default',
      OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL || 'Using default',
      OPENAI_CHAT_MODEL: env.OPENAI_CHAT_MODEL || 'Using default',
    });
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
    console.log('🌐 Client IP:', clientIP);

    // CORS headers - dynamically set based on request origin
    const requestOrigin = request.headers.get('Origin');
    const allowedOrigins = (
      env.ALLOWED_ORIGINS || 'http://localhost:3000'
    ).split(',');

    // For development, allow any localhost origin
    const isLocalhost =
      requestOrigin?.startsWith('http://localhost:') ||
      requestOrigin?.startsWith('http://127.0.0.1:');

    const allowedOrigin =
      allowedOrigins.includes(requestOrigin || '') || isLocalhost
        ? requestOrigin
        : allowedOrigins[0]; // fallback to first allowed origin

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    console.log('🔒 CORS Headers:', corsHeaders);

    // Handle preflight requests
    if (method === 'OPTIONS') {
      console.log('🔄 Handling OPTIONS preflight request');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Rate limiting check
    const rateLimitOk = await checkRateLimit(clientIP);
    console.log(
      '⏱️ Rate Limit Check:',
      rateLimitOk ? '✅ Allowed' : '❌ Blocked'
    );
    if (!rateLimitOk) {
      console.log('🚫 Rate limit exceeded for IP:', clientIP);
      return new Response('Rate limited', {
        status: 429,
        headers: corsHeaders,
      });
    }

    try {
      // Initialize Supabase client with service role key for server-side operations
      console.log('🔗 Initializing Supabase client...');
      const supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('✅ Supabase client initialized with service role');

      // Initialize OpenAI client
      console.log('🤖 Initializing OpenAI client...');
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI client initialized');

      // Authentication for protected endpoints
      let userId: string | null = null;
      if (['/chat', '/search'].includes(url.pathname)) {
        console.log('🔐 Checking authentication for protected endpoint...');
        userId = await validateAuth(request, supabase);
        if (!userId) {
          console.log('❌ Authentication failed');
          return new Response('Unauthorized', {
            status: 401,
            headers: corsHeaders,
          });
        }
        console.log('✅ Authentication successful, User ID:', userId);
      }

      // Route handling
      switch (url.pathname) {
        case '/health':
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case '/debug':
          return new Response(
            JSON.stringify({
              status: 'ok',
              timestamp: new Date().toISOString(),
              origin: request.headers.get('Origin') || 'unknown',
              method: method,
              pathname: url.pathname,
              corsHeaders: corsHeaders,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );

        case '/':
          return new Response(
            JSON.stringify({
              message: 'MCP Server is running!',
              version: '1.0.0',
              endpoints: {
                health: 'GET /health',
                embed: 'POST /embed',
                search: 'POST /search',
                chat: 'POST /chat',
              },
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );

        case '/embed':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleEmbed(request, openai, corsHeaders, env);

        case '/search':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleSearch(request, supabase, openai, corsHeaders, env);

        case '/chat':
          if (method !== 'POST') {
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleChat(
            request,
            supabase,
            openai,
            corsHeaders,
            userId!,
            env
          );

        default:
          return new Response('Not found', {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error('❌ Worker Error:', error);
      console.error('📊 Error Details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });
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
  corsHeaders: Record<string, string>,
  env: Env
): Promise<Response> {
  const { text } = (await request.json()) as { text: string };

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const embedding = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
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
  corsHeaders: Record<string, string>,
  env: Env
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
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
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
  userId: string,
  env: Env
): Promise<Response> {
  console.log('💬 Starting chat handler...');
  const { message, sessionId } = (await request.json()) as {
    message: string;
    sessionId: string;
  };

  console.log('📝 Chat Input:', {
    message: message?.substring(0, 100) + (message?.length > 100 ? '...' : ''),
    sessionId: sessionId || 'New session',
    userId,
  });

  // Validate input
  const validation = validateInput({ message });
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get or create session (using authenticated userId)
  console.log('🗂️ Managing chat session...');
  let session;
  if (sessionId) {
    console.log('📂 Loading existing session:', sessionId);
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId) // Ensure user owns the session
      .single();
    session = data;
    console.log('✅ Session loaded:', session?.id);
  } else {
    console.log('🆕 Creating new session...');
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (error) {
      console.log('❌ Session creation error:', error);
      throw error;
    }
    session = data;
    console.log('✅ New session created:', session?.id);
  }

  // Get recent messages for context
  console.log('📚 Loading chat history...');
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(10);
  console.log('📖 Found', messages?.length || 0, 'previous messages');

  // Search for relevant documents
  console.log('🔍 Generating embedding for message...');
  const embedding = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    input: message,
  });
  console.log(
    '✅ Embedding generated, dimensions:',
    embedding.data[0].embedding.length
  );

  console.log('🔎 Searching for relevant documents...');
  const { data: relevantDocs } = await supabase.rpc('search_documents', {
    query_embedding: embedding.data[0].embedding,
    match_threshold: 0.7,
    match_count: 5,
  });
  console.log('📄 Found', relevantDocs?.length || 0, 'relevant documents');

  // Build context from relevant documents
  const context =
    relevantDocs
      ?.map((doc: any) => `${doc.title}: ${doc.content}`)
      .join('\n\n') || '';
  console.log('📝 Context length:', context.length, 'characters');

  // Prepare messages for OpenAI
  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI assistant with full access to a Supabase database.

DATABASE ACCESS:
- You have read/write access to the database via Supabase
- Available tables: chat_sessions, chat_messages
- You can query, insert, update, and delete data
- Use the Supabase client to interact with the database

DATABASE SCHEMA:
- chat_sessions: id, title, user_id, created_at, updated_at
- chat_messages: id, session_id, role, content, created_at

When users ask about database operations, you can:
1. Query existing data and show results
2. Show table schemas and structure
3. Create new records
4. Update existing data
5. Explain database relationships

Use the following context to answer questions:

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

  console.log('🤖 Sending request to OpenAI...');
  console.log('📊 Request details:', {
    model: env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messageCount: chatMessages.length,
    maxTokens: 1000,
    temperature: 0.7,
  });

  // Get response from OpenAI
  const completion = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messages: chatMessages as any,
    max_completion_tokens: 4000, // Increased from 1000 to allow for reasoning + response
    // Note: Some models (like gpt-5-nano) don't support custom temperature
    // temperature: 0.7,
  });

  console.log('✅ OpenAI response received');
  console.log('📊 Response details:', {
    usage: completion.usage,
    finishReason: completion.choices[0].finish_reason,
  });

  const assistantMessage = completion.choices[0].message.content;
  console.log(
    '🔍 Full completion response:',
    JSON.stringify(completion, null, 2)
  );
  console.log('🔍 Choices array:', completion.choices);
  console.log('🔍 First choice message:', completion.choices[0]?.message);
  console.log(
    '💬 Assistant response length:',
    assistantMessage?.length || 0,
    'characters'
  );
  console.log('💬 Assistant response content:', assistantMessage);

  // If the AI asks about database operations, provide actual database info
  let enhancedResponse = assistantMessage;
  if (
    assistantMessage &&
    (assistantMessage.toLowerCase().includes('database') ||
      assistantMessage.toLowerCase().includes('table') ||
      assistantMessage.toLowerCase().includes('schema'))
  ) {
    try {
      // Get actual database info
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .limit(5);

      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(5);

      // Create intelligent summary instead of raw dump
      let dbSummary = `\n\n--- DATABASE ANALYSIS ---\n`;
      dbSummary += `✅ Database Connection: Active\n\n`;

      if (sessionsError) {
        dbSummary += `❌ Chat Sessions: Error - ${sessionsError.message}\n`;
      } else {
        dbSummary += `📊 Chat Sessions: ${
          sessions?.length || 0
        } total sessions\n`;
        if (sessions && sessions.length > 0) {
          const recentSessions = sessions.slice(0, 3);
          dbSummary += `Recent sessions:\n`;
          recentSessions.forEach((session: any, i: number) => {
            dbSummary += `  ${i + 1}. "${
              session.title || 'Untitled'
            }" (${new Date(session.created_at).toLocaleDateString()})\n`;
          });
        }
      }

      if (messagesError) {
        dbSummary += `❌ Chat Messages: Error - ${messagesError.message}\n`;
      } else {
        dbSummary += `💬 Chat Messages: ${
          messages?.length || 0
        } total messages\n`;
        if (messages && messages.length > 0) {
          const userMessages = messages.filter(
            (m: any) => m.role === 'user'
          ).length;
          const assistantMessages = messages.filter(
            (m: any) => m.role === 'assistant'
          ).length;
          dbSummary += `  - User messages: ${userMessages}\n`;
          dbSummary += `  - Assistant messages: ${assistantMessages}\n`;

          // Show recent conversation activity
          const recentMessages = messages.slice(0, 3);
          dbSummary += `Recent activity:\n`;
          recentMessages.forEach((msg: any, i: number) => {
            const preview =
              msg.content.length > 50
                ? msg.content.substring(0, 50) + '...'
                : msg.content;
            dbSummary += `  ${i + 1}. [${msg.role}] ${preview}\n`;
          });
        }
      }

      enhancedResponse = `${assistantMessage}${dbSummary}`;
      console.log('🔍 Enhanced response with database info');
    } catch (error) {
      console.log('❌ Error getting database info:', error);
    }
  }

  // Save messages to database
  console.log('💾 Saving messages to database...');
  await supabase.from('chat_messages').insert([
    { session_id: session.id, role: 'user', content: message },
    { session_id: session.id, role: 'assistant', content: assistantMessage },
  ]);
  console.log('✅ Messages saved successfully');

  console.log('🎉 Chat handler completed successfully');
  return new Response(
    JSON.stringify({
      response: enhancedResponse,
      sessionId: session.id,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

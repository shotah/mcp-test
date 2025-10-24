import OpenAI from 'openai';
import { Logger } from '../logger';
import { ChatRequest, ChatResponse, Env } from '../types';

/**
 * Input validation function
 */
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

/**
 * Chat handler
 */
export async function handleChat(
  request: Request,
  supabase: any,
  openai: OpenAI,
  corsHeaders: Record<string, string>,
  userId: string,
  env: Env
): Promise<Response> {
  Logger.ai('Starting chat request');

  const { message, sessionId } = (await request.json()) as ChatRequest;

  Logger.ai('Chat input received', {
    messageLength: message?.length || 0,
    sessionId: sessionId || 'New session',
    userId,
  });

  // Validate input
  const validation = validateInput({ message });
  if (!validation.valid) {
    Logger.warning('Invalid chat input', validation);
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get or create session
  Logger.database('Managing chat session');
  let session;
  if (sessionId) {
    Logger.database('Loading existing session', { sessionId });
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    session = data;
  } else {
    Logger.database('Creating new session');
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (error) {
      Logger.error('Session creation error', error);
      throw error;
    }
    session = data;
  }

  // Get recent messages for context
  Logger.database('Loading chat history');
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(10);

  // Search for relevant documents
  Logger.ai('Generating message embedding');
  const embedding = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    input: message,
  });

  Logger.database('Searching for relevant documents');
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
    content: `You are a helpful AI assistant with access to a Supabase database.

DATABASE ACCESS:
- You have read/write access to the database via Supabase
- Available tables: chat_sessions, chat_messages
- You can query, insert, update, and delete data

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

  Logger.ai('Sending request to OpenAI', {
    model: env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messageCount: chatMessages.length,
  });

  // Get response from OpenAI
  const completion = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messages: chatMessages as any,
    max_completion_tokens: 4000,
  });

  const assistantMessage = completion.choices[0].message.content;

  // If the AI asks about database operations, provide actual database info
  let enhancedResponse = assistantMessage;
  if (
    assistantMessage &&
    (assistantMessage.toLowerCase().includes('database') ||
      assistantMessage.toLowerCase().includes('table') ||
      assistantMessage.toLowerCase().includes('schema'))
  ) {
    try {
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .limit(5);

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(5);

      let dbSummary = `\n\n--- DATABASE ANALYSIS ---\n`;
      dbSummary += `✅ Database Connection: Active\n\n`;
      dbSummary += `📊 Chat Sessions: ${
        sessions?.length || 0
      } total sessions\n`;
      dbSummary += `💬 Chat Messages: ${
        messages?.length || 0
      } total messages\n`;

      enhancedResponse = `${assistantMessage}${dbSummary}`;
      Logger.database('Enhanced response with database info');
    } catch (error) {
      Logger.error('Error getting database info', error);
    }
  }

  // Save messages to database
  Logger.database('Saving messages to database');
  await supabase.from('chat_messages').insert([
    { session_id: session.id, role: 'user', content: message },
    { session_id: session.id, role: 'assistant', content: assistantMessage },
  ]);

  const response: ChatResponse = {
    response: enhancedResponse || 'No response',
    sessionId: session.id,
  };

  Logger.success('Chat completed successfully');
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

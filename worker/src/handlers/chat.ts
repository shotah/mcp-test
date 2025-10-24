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

  // No database data upfront - we'll do mock function calls instead

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

AVAILABLE QUERIES:
- LOOKUP_USERS: Find users who have chatted
- LOOKUP_SESSIONS: Get chat sessions
- LOOKUP_MESSAGES: Get messages from a session
- LOOKUP_STATS: Get database statistics

IMPORTANT: When users ask about database operations, you MUST use one of these queries:
1. For user-related questions → Use LOOKUP_USERS
2. For session-related questions → Use LOOKUP_SESSIONS  
3. For message-related questions → Use LOOKUP_MESSAGES
4. For statistics questions → Use LOOKUP_STATS

CRITICAL: Always mention the specific query you're using in your response, like "I'll use LOOKUP_SESSIONS to get the session data" or "Let me run LOOKUP_USERS to find the users."

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
    model: env.OPENAI_CHAT_MODEL || 'gpt-5-nano',
    messageCount: chatMessages.length,
  });

  // Get response from OpenAI
  const completion = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL || 'gpt-5-nano',
    messages: chatMessages as any,
    max_completion_tokens: 4000,
  });

  const assistantMessage = completion.choices[0].message.content;

  // Check for mock function calls and execute them
  let finalResponse = assistantMessage;
  let mockFunctionExecuted = false;
  const mockFunctionCalls = [
    { pattern: /LOOKUP_USERS/i, handler: 'getUsers' },
    { pattern: /LOOKUP_SESSIONS/i, handler: 'getSessions' },
    { pattern: /LOOKUP_MESSAGES/i, handler: 'getMessages' },
    { pattern: /LOOKUP_STATS/i, handler: 'getStats' },
  ];

  // Debug: Log what we're checking
  Logger.debug('Checking for mock function calls', {
    messageLength: assistantMessage?.length || 0,
    messagePreview: assistantMessage?.substring(0, 200) || 'No message',
  });

  for (const { pattern, handler } of mockFunctionCalls) {
    const isMatch = assistantMessage && pattern.test(assistantMessage);
    Logger.debug(`Testing pattern ${pattern} for handler ${handler}`, {
      isMatch,
      pattern: pattern.toString(),
    });

    if (isMatch) {
      mockFunctionExecuted = true;
      Logger.database(`AI requested mock function: ${handler}`);
      Logger.ai(`Agent chose to use ${handler} for database query`);

      try {
        let functionResult = '';
        switch (handler) {
          case 'getUsers': {
            const { data: userSessions } = await supabase
              .from('chat_sessions')
              .select('user_id')
              .order('created_at', { ascending: false })
              .limit(50);

            const uniqueUsers = [
              ...new Set(userSessions?.map((s: any) => s.user_id) || []),
            ];
            functionResult = `Found ${
              uniqueUsers.length
            } unique users: ${uniqueUsers.slice(0, 10).join(', ')}`;
            break;
          }

          case 'getSessions': {
            const { data: sessions } = await supabase
              .from('chat_sessions')
              .select('id, title, user_id, created_at')
              .order('created_at', { ascending: false })
              .limit(10);

            functionResult = `Found ${sessions?.length || 0} sessions:\n${
              sessions
                ?.map(
                  (s: any, i: number) =>
                    `${i + 1}. ${s.title} (User: ${s.user_id}, Created: ${
                      s.created_at
                    })`
                )
                .join('\n') || 'No sessions found'
            }`;
            break;
          }

          case 'getMessages': {
            const { data: messages } = await supabase
              .from('chat_messages')
              .select('id, session_id, role, content, created_at')
              .order('created_at', { ascending: false })
              .limit(20);

            functionResult = `Found ${
              messages?.length || 0
            } recent messages:\n${
              messages
                ?.slice(0, 5)
                .map(
                  (m: any, i: number) =>
                    `${i + 1}. [${m.role}] ${m.content.substring(
                      0,
                      50
                    )}... (Session: ${m.session_id})`
                )
                .join('\n') || 'No messages found'
            }`;
            break;
          }

          case 'getStats': {
            const { data: sessionCount } = await supabase
              .from('chat_sessions')
              .select('id', { count: 'exact' });

            const { data: messageCount } = await supabase
              .from('chat_messages')
              .select('id', { count: 'exact' });

            functionResult = `Database Statistics:\n- Total Sessions: ${
              sessionCount?.length || 0
            }\n- Total Messages: ${messageCount?.length || 0}`;
            break;
          }
        }

        // Send the query result back to GPT for proper processing
        Logger.ai('Sending database results back to GPT for processing', {
          function: handler,
          resultLength: functionResult.length,
          resultPreview: functionResult.substring(0, 200),
        });

        const followUpMessages = [
          ...chatMessages,
          {
            role: 'assistant' as const,
            content: assistantMessage,
          },
          {
            role: 'user' as const,
            content: `Here are the database query results:\n\n${functionResult}\n\nPlease provide a direct, helpful response with the actual data. Do not ask for additional input - just present the results clearly.`,
          },
        ];

        const followUpCompletion = await openai.chat.completions.create({
          model: env.OPENAI_CHAT_MODEL || 'gpt-5-nano',
          messages: followUpMessages as any,
          max_completion_tokens: 4000,
        });

        Logger.ai('GPT processed database results successfully', {
          function: handler,
          responseLength:
            followUpCompletion.choices[0].message.content?.length || 0,
        });

        finalResponse =
          followUpCompletion.choices[0].message.content || assistantMessage;
        Logger.database(
          `Mock function ${handler} executed and processed by GPT`
        );
        break; // Only execute the first matching function
      } catch (error) {
        Logger.error(`Error executing mock function ${handler}`, error);
        finalResponse = `${assistantMessage}\n\n[Error: Could not retrieve database information]`;
      }
    }
  }

  // Log if no mock function was triggered
  if (!mockFunctionExecuted) {
    Logger.ai('No database query needed - AI provided direct response');
  } else {
    Logger.ai('Mock function executed successfully');
  }

  // Save messages to database
  Logger.database('Saving messages to database');
  await supabase.from('chat_messages').insert([
    { session_id: session.id, role: 'user', content: message },
    { session_id: session.id, role: 'assistant', content: assistantMessage },
  ]);

  const response: ChatResponse = {
    response: finalResponse || 'No response',
    sessionId: session.id,
  };

  Logger.success('Chat completed successfully');
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
